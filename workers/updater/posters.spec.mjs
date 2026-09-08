import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from 'cloudflare:test';
import { runPosters } from './src/posters.mjs';
import { fakeSplatNet, ROUTES } from './fakeSplatNet.mjs';
import { getTopOfCurrentHour } from '../../src/common/time.js';

// The posters (src/app/social) running inside workerd: data from R2, screenshots from a
// stubbed Browser Rendering endpoint, no social credentials (shadow mode).
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('runPosters', () => {
  let renders;

  beforeEach(async () => {
    process.env.SITE_URL = 'https://example.test';
    process.env.CLOUDFLARE_ACCOUNT_ID = 'acct';
    process.env.CLOUDFLARE_BROWSER_RUN_API_TOKEN = 'token';

    for (let name of ['BLUESKY_SERVICE', 'BLUESKY_IDENTIFIER', 'BLUESKY_PASSWORD'])
      delete process.env[name];

    let now = getTopOfCurrentHour();
    let rotation = { ...ROUTES['/api/schedules']().regular[0], start_time: now, end_time: now + 7200 };

    await env.ASSETS.put(
      'data/schedules.json',
      JSON.stringify({ regular: [rotation], gachi: [rotation], league: [rotation] }),
    );
    await env.ASSETS.put(
      'data/festivals.json',
      JSON.stringify({
        na: { festivals: [], results: [] },
        eu: { festivals: [], results: [] },
        jp: { festivals: [], results: [] },
      }),
    );
    await env.ASSETS.put('data/coop-schedules.json', JSON.stringify({ schedules: [], details: [] }));
    await env.ASSETS.put('data/timeline.json', JSON.stringify({ coop: null, weapon_availability: null }));
    await env.ASSETS.put(
      'data/merchandises.json',
      JSON.stringify({
        merchandises: [{ end_time: now + 3600, gear: { name: 'Hat' }, skill: { name: 'Skill' } }],
      }),
    );

    await env.ASSETS.put('data/locale/en.json', JSON.stringify({}));
    renders = [];

    let splatnet = fakeSplatNet();

    vi.stubGlobal('fetch', async (input, init) => {
      let url = new URL(input);

      if (url.hostname === 'example.test') {
        let object = await env.ASSETS.get(url.pathname.slice(1));

        return object ? new Response(object.body) : new Response('missing', { status: 404 });
      }

      if (url.hostname === 'api.cloudflare.com') {
        renders.push(JSON.parse(init.body));

        return new Response(PNG, { headers: { 'content-type': 'image/png' } });
      }

      return splatnet(input, init);
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('renders the public images for the hour without posting anywhere', async () => {
    let summary = await runPosters(env);

    expect(summary.ok).toBe(true);
    expect(summary.clients).toEqual([]);
    expect(renders.map(r => r.url)).toEqual([
      `https://example.test/screenshots.html#/schedules/${getTopOfCurrentHour()}`,
      `https://example.test/screenshots.html#/splatNetGear/${getTopOfCurrentHour()}`,
    ]);
    expect(renders.every(r => r.screenshotOptions.type === 'png')).toBe(true);
    expect(await env.ASSETS.get('twitter-images/schedule.png')).not.toBeNull();
    expect(await env.ASSETS.get('twitter-images/gear.png')).not.toBeNull();
    expect((await env.ASSETS.head('twitter-images/schedule.png')).httpMetadata.contentType).toBe('image/png');
    expect(await env.PRIVATE.get('bluesky-lastPostTimes.json')).toBeNull(); // nothing was posted
  });

  it('rejects a rendering site serving different data before making screenshots', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ stale: true }));

    await expect(runPosters(env)).rejects.toThrow('Rendering site data does not match');
    expect(renders).toEqual([]);
  });
});
