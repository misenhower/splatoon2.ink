import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { captureScreenshot, captureNewWeaponScreenshot, captureSplatfestScreenshot } from '../../src/app/screenshots/screenshots.js';

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

function fakeBrowserRendering(respond = () => new Response(PNG, { headers: { 'content-type': 'image/png' } })) {
  const requests = [];
  mock.method(globalThis, 'fetch', async (input, init) => {
    requests.push({ url: new URL(input), headers: new Headers(init.headers), body: JSON.parse(init.body) });
    return respond();
  });
  return requests;
}

beforeEach(() => {
  process.env.SITE_URL = 'https://example.test';
  process.env.CLOUDFLARE_ACCOUNT_ID = 'acct';
  process.env.CLOUDFLARE_BROWSER_RUN_API_TOKEN = 'token';
});
afterEach(() => mock.restoreAll());

test('asks Browser Rendering for the deployed screenshot page at the default viewport', async () => {
  const requests = fakeBrowserRendering();
  const result = await captureScreenshot({ hash: '/schedules/3600' });

  assert.equal(requests.length, 1);
  const [{ url, headers, body }] = requests;
  assert.equal(url.href, 'https://api.cloudflare.com/client/v4/accounts/acct/browser-rendering/screenshot?cacheTTL=0');
  assert.equal(headers.get('authorization'), 'Bearer token');
  assert.equal(body.url, 'https://example.test/screenshots.html#/schedules/3600');
  assert.deepEqual(body.viewport, { width: 1216, height: 684, deviceScaleFactor: 2 });
  assert.deepEqual(body.gotoOptions, { waitUntil: 'domcontentloaded', timeout: 10_000 });
  assert.deepEqual(body.screenshotOptions, { type: 'png' });
  assert.equal(body.actionTimeout, 10_000);
  assert.deepEqual(body.waitForSelector, { selector: '[data-screenshot-ready="true"]', timeout: 10_000 });
  assert.deepEqual(body.setExtraHTTPHeaders, { 'Cache-Control': 'no-cache' });
  assert.deepEqual(result, { image: PNG, type: 'image/png', width: 2432, height: 1368 });
});

test('the new-weapon screenshot grows with the number of weapons, and splatfest passes its regions', async () => {
  const requests = fakeBrowserRendering();
  const tall = await captureNewWeaponScreenshot(3600, 9);
  assert.equal(requests[0].body.viewport.height, 3 * 320 + 60);
  assert.equal(tall.height, (3 * 320 + 60) * 2);
  const short = await captureNewWeaponScreenshot(3600, 1);
  assert.equal(requests[1].body.viewport.height, 700);
  assert.equal(short.width, 2432);

  await captureSplatfestScreenshot('na', 3600, ['na', 'eu']);
  assert.equal(requests[2].body.url, 'https://example.test/screenshots.html#/splatfest/na/3600?regions=na,eu');
});

test('reports API errors with Cloudflare\'s message', async () => {
  fakeBrowserRendering(() => Response.json({ errors: [{ message: 'Invalid token' }] }, { status: 401 }));
  await assert.rejects(captureScreenshot({ hash: '/x' }), /Browser Rendering screenshot failed \(401\): Invalid token/);
});

test('fails clearly when configuration is missing', async () => {
  delete process.env.CLOUDFLARE_BROWSER_RUN_API_TOKEN;
  await assert.rejects(captureScreenshot({ hash: '/x' }), /Missing screenshot configuration: CLOUDFLARE_BROWSER_RUN_API_TOKEN/);
});

function immediateBackoff() {
  const delays = [];
  mock.method(globalThis, 'setTimeout', (callback, delay) => {
    delays.push(delay);
    queueMicrotask(callback);
  });
  return delays;
}

test('retries timeout responses and succeeds with the same screenshot request', async () => {
  const delays = immediateBackoff();
  let attempt = 0;
  const requests = fakeBrowserRendering(() => ++attempt < 3
    ? Response.json({ errors: [{ message: 'Navigation timeout of 10000 ms exceeded' }] }, { status: 422 })
    : new Response(PNG));
  const result = await captureScreenshot({ hash: '/schedules/3600' });
  assert.deepEqual(result.image, PNG);
  assert.equal(requests.length, 3);
  assert.deepEqual(requests[0].body, requests[2].body);
  assert.deepEqual(delays, [500, 1000]);
});

test('stops after three retries and preserves the final error', async () => {
  const delays = immediateBackoff();
  const requests = fakeBrowserRendering(() => new Response('upstream unavailable', { status: 503 }));
  await assert.rejects(captureScreenshot({ hash: '/x' }), /503.*upstream unavailable/);
  assert.equal(requests.length, 4);
  assert.deepEqual(delays, [500, 1000, 2000]);
});

test('does not retry authentication, rate limits or non-timeout validation errors', async () => {
  const delays = immediateBackoff();
  for (const status of [401, 403, 429, 422]) {
    let count = 0;
    const requests = fakeBrowserRendering(() => { count++; return new Response('invalid request', { status }); });
    await assert.rejects(captureScreenshot({ hash: '/x' }), new RegExp(String(status)));
    assert.equal(count, 1);
    assert.equal(requests.length, 1);
  }
  assert.deepEqual(delays, []);
});

test('retries network and client deadline failures, including while reading the image', async () => {
  immediateBackoff();
  let attempt = 0;
  const requests = fakeBrowserRendering(() => {
    attempt++;
    if (attempt === 1) throw new TypeError('fetch failed');
    if (attempt === 2) throw new DOMException('request timed out', 'TimeoutError');
    if (attempt === 3) return new Response(new ReadableStream({ start(controller) { controller.error(new TypeError('connection reset')); } }));
    return new Response(PNG);
  });
  assert.deepEqual((await captureScreenshot({ hash: '/x' })).image, PNG);
  assert.equal(requests.length, 4);
});
