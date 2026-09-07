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
  assert.deepEqual(body.gotoOptions, { waitUntil: 'networkidle0', timeout: 30_000 });
  assert.deepEqual(body.screenshotOptions, { type: 'png' });
  assert.equal(body.actionTimeout, 30_000);
  assert.deepEqual(body.setExtraHTTPHeaders, { 'Cache-Control': 'no-cache' });
  assert.deepEqual(result, { image: PNG, type: 'image/png', width: 2432, height: 1368 });
});

test('renders JPEG on request', async () => {
  const requests = fakeBrowserRendering();
  const result = await captureScreenshot({ hash: '/schedules/3600', format: 'jpeg' });
  assert.deepEqual(requests[0].body.screenshotOptions, { type: 'jpeg', quality: 90 });
  assert.equal(result.type, 'image/jpeg');
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
