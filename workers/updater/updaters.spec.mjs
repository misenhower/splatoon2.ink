import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from 'cloudflare:test';
import { runUpdaters } from './src/updaters.mjs';
import { fakeSplatNet, setSessionEnvironment } from './fakeSplatNet.mjs';

// The shared updaters (src/app/updater) running inside workerd against the R2 bindings.
setSessionEnvironment();

async function keys(bucket, prefix = '') {
  return (await bucket.list({ prefix })).objects.map(o => o.key).sort();
}

describe('runUpdaters', () => {
  let fetch;
  beforeEach(() => { fetch = fakeSplatNet(); vi.stubGlobal('fetch', fetch); });
  afterEach(() => vi.unstubAllGlobals());

  it('runs every updater against the R2 bindings and publishes the site data', async () => {
    let summary = await runUpdaters(env);

    expect(summary.ok).toBe(true);
    expect(summary.updaters[1].summary).toMatchObject({ localizedFetches: expect.any(Array), imagesDownloaded: expect.any(Number), stagesSeeded: true });
    expect(Object.keys(summary.updaters[1].summary.timings)).toEqual(['fetch', 'localize', 'process', 'publish', 'images']);
    expect(summary.updaters.map(u => u.name)).toEqual([
      'Original Gear', 'Schedules', 'Co-op Schedules', 'Timeline', 'Festivals NA', 'Festivals EU', 'Festivals JP', 'Merchandises',
    ]);
    expect(await keys(env.ASSETS, 'data/')).toEqual(expect.arrayContaining([
      'data/schedules.json', 'data/coop-schedules.json', 'data/coop-schedules.ics', 'data/timeline.json',
      'data/festivals.json', 'data/festivals-na.ics', 'data/festivals-eu.ics', 'data/festivals-jp.ics',
      'data/festivals/na-1-rankings.json', 'data/merchandises.json', 'data/locale/en.json', 'data/locale/ja.json',
    ]));
    expect(await keys(env.PRIVATE)).toEqual(['stages.json']);

    let schedules = await (await env.ASSETS.get('data/schedules.json')).json();
    expect(schedules.regular[0].stage_a.name).toBe('The Reef');
    expect((await env.ASSETS.head('data/schedules.json')).httpMetadata.cacheControl).toContain('stale-while-revalidate');
    expect(await keys(env.ASSETS, 'assets/splatnet/images/stage/')).toEqual(['assets/splatnet/images/stage/0.png', 'assets/splatnet/images/stage/1.png', 'assets/splatnet/images/stage/100.png']);

    let festivals = await (await env.ASSETS.get('data/festivals.json')).json();
    expect(Object.keys(festivals).sort()).toEqual(['eu', 'jp', 'na']);
    expect(fetch.requests.find(r => r.path === '/api/schedules').cookie).toBe('iksm_session=na-session');
  });

  it('can run a subset of updaters, and reports a failing one without stopping the rest', async () => {
    await env.ASSETS.delete(['data/timeline.json', 'data/merchandises.json']);
    vi.stubGlobal('fetch', fakeSplatNet({ '/api/timeline': () => new Response('down', { status: 503 }), '/api/onlineshop/merchandises': () => ({ merchandises: [] }) }));
    let summary = await runUpdaters(env, { only: ['Timeline', 'Merchandises'] });

    expect(summary.ok).toBe(false);
    expect(summary.updaters).toMatchObject([
      { name: 'Timeline', ok: false, error: expect.stringContaining('status 503') },
      { name: 'Merchandises', ok: true },
    ]);
    expect(await env.ASSETS.get('data/timeline.json')).toBeNull();
    expect(await env.ASSETS.get('data/merchandises.json')).not.toBeNull();
  });
});
