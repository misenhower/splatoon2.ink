import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createExecutionContext, createScheduledController, env, runDurableObjectAlarm, runInDurableObject } from 'cloudflare:test';
import worker from './src/index.mjs';
import { nextRunAt, GRACE_MS, HOUR_MS } from './src/schedule.mjs';
import { fakeSplatNet, setSessionEnvironment } from './fakeSplatNet.mjs';

function stub() {
  return env.SCHEDULER.get(env.SCHEDULER.idFromName(`test-${crypto.randomUUID()}`));
}

async function runAlarmUntil(scheduler, done) {
  await runDurableObjectAlarm(scheduler);
  await vi.waitFor(async () => expect(done(await scheduler.status())).toBe(true), { timeout: 5000 });
  return scheduler.status();
}

function network({ down = false, renderFails = false, beforeRequest } = {}) {
  let splatnet = fakeSplatNet();
  let renders = [];
  vi.stubGlobal('fetch', async (input, init) => {
    const url = new URL(input);
    if (url.hostname === 'site.test') {
      let object = await env.ASSETS.get(url.pathname.slice(1));
      return object ? new Response(object.body) : new Response('missing', { status: 404 });
    }
    if (url.hostname === 'api.cloudflare.com') {
      renders.push(JSON.parse(init.body));
      return new Response(renderFails ? 'render failed' : new Uint8Array([1, 2]), { status: renderFails ? 503 : 200 });
    }
    await beforeRequest?.();
    return down ? new Response('down', { status: 503 }) : splatnet(input, init);
  });
  return renders;
}

beforeEach(() => {
  setSessionEnvironment();
  process.env.SITE_URL = 'https://site.test';
  process.env.CLOUDFLARE_ACCOUNT_ID = 'test';
  process.env.CLOUDFLARE_BROWSER_RUN_API_TOKEN = 'test';
  for (let name of ['BLUESKY_SERVICE', 'BLUESKY_IDENTIFIER', 'BLUESKY_PASSWORD'])
    delete process.env[name];
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('Scheduler', () => {
  it('arms the hourly job for :00:10 and preserves an existing schedule', async () => {
    let scheduler = stub();
    let before = Date.now();
    let first = await scheduler.ensureArmed();
    expect(first.armed).toBe(true);
    expect(first.hourlyAt).toBeGreaterThanOrEqual(nextRunAt(before));
    expect((first.hourlyAt - GRACE_MS) % HOUR_MS).toBe(0);
    expect(await scheduler.ensureArmed()).toEqual({ ...first, armed: false });
  });

  it('persists a pause through watchdog calls and only resumes explicitly', async () => {
    network();
    let scheduler = stub();
    await scheduler.ensureArmed();
    expect(await scheduler.pause()).toEqual({ ok: true, paused: true });
    expect(await scheduler.ensureArmed()).toEqual({ armed: false, paused: true });
    expect((await scheduler.status()).alarmAt).toBeNull();
    expect(await scheduler.run()).toMatchObject({ ok: false, paused: true });
    await scheduler.resume();
    expect((await scheduler.status()).alarmAt).not.toBeNull();
    expect((await scheduler.status()).paused).toBe(false);
  });

  it('repairs a missing alarm without moving its due time', async () => {
    let scheduler = stub();
    let initial = await scheduler.ensureArmed();
    await runInDurableObject(scheduler, async (instance, state) => state.storage.deleteAlarm());
    expect(await scheduler.ensureArmed()).toEqual({ ...initial, armed: true });
  });

  it('converts pending requests from the previous deployment into a full run', async () => {
    network();
    let scheduler = stub();
    let hourlyAt = nextRunAt();
    await runInDurableObject(scheduler, async (instance, state) => {
      await state.storage.put('state', { hourlyAt, pending: ['updaters', 'posters'] });
    });
    await scheduler.ensureArmed();
    let status = await runAlarmUntil(scheduler, s => s.lastRun !== null);
    expect(status.lastRun.ok).toBe(true);
    expect(status.hourlyAt).toBe(hourlyAt);
    expect(status.retryAt).toBeNull();
  });

  it('runs a full hourly pipeline, records completion timing, and schedules the next hour', async () => {
    network();
    let scheduler = stub();
    let { hourlyAt } = await scheduler.ensureArmed();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(hourlyAt + 1);
    let status = await runAlarmUntil(scheduler, s => s.hourlyAt !== hourlyAt);
    expect(status.lastRun.ok).toBe(true);
    expect(status.lastRun.updaters.updaters).toHaveLength(8);
    expect(status.lastRun.social.ok).toBe(true);
    expect(status.lastRun.driftMs).toBeGreaterThanOrEqual(1);
    expect(status.alarmAt).toBe(hourlyAt + HOUR_MS);
  });

  it('skips social after updater failure and gives up after three retries', async () => {
    let renders = network({ down: true });
    let scheduler = stub();
    let { hourlyAt } = await scheduler.ensureArmed();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(hourlyAt + 5);
    let status = await runAlarmUntil(scheduler, s => s.retries === 1);
    expect(status.lastRun.updaters.ok).toBe(false);
    expect(status.lastRun.social).toMatchObject({ skipped: true, reason: 'updater-failed' });
    expect(renders).toEqual([]);
    for (let attempt = 2; attempt <= 3; attempt++) {
      vi.setSystemTime(status.retryAt);
      status = await runAlarmUntil(scheduler, s => s.retries === attempt);
    }
    vi.setSystemTime(status.retryAt);
    status = await runAlarmUntil(scheduler, s => s.retryAt === null);
    expect(status.retries).toBe(0);
    expect(status.alarmAt).toBe(hourlyAt + HOUR_MS);
  });

  it('retries screenshot failures instead of reporting a successful social run', async () => {
    network({ renderFails: true });
    let scheduler = stub();
    let { hourlyAt } = await scheduler.ensureArmed();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(hourlyAt + 1);
    let status = await runAlarmUntil(scheduler, s => s.retries === 1);
    expect(status.lastRun.updaters.ok).toBe(true);
    expect(status.lastRun.social.ok).toBe(false);
    expect(status.lastRun.social.posts.some(post => post.ok === false)).toBe(true);
  });

  it('manual targeted repairs do not post or move the hourly schedule', async () => {
    let renders = network();
    let scheduler = stub();
    let { hourlyAt } = await scheduler.ensureArmed();
    let result = await scheduler.run({ only: ['Schedules'] });
    expect(result.ok).toBe(true);
    expect(result.updaters.updaters.map(u => u.name)).toEqual(['Schedules']);
    expect(result.social.reason).toBe('targeted-update');
    expect(renders).toEqual([]);
    expect((await scheduler.status()).hourlyAt).toBe(hourlyAt);
    expect((await scheduler.run({ only: ['typo'] })).ok).toBe(false);
    expect((await scheduler.status()).busy).toBe(false);
  });

  it('rejects overlapping manual work explicitly and preserves an hourly alarm due during it', async () => {
    let release;
    let gate = new Promise(resolve => { release = resolve; });
    let entered = false;
    network({ beforeRequest: async () => { entered = true; await gate; } });
    let scheduler = stub();
    let { hourlyAt } = await scheduler.ensureArmed();
    let first = scheduler.run({ only: ['Schedules'] });
    try {
      await vi.waitFor(() => expect(entered).toBe(true));
      expect((await scheduler.status()).activeRun.logs.lines.some(line => line.text.includes('Updating data'))).toBe(true);
      expect(await scheduler.run()).toMatchObject({ ok: false, busy: true });
      expect(await scheduler.ensureArmed()).toMatchObject({ busy: true });
      expect(await scheduler.pause()).toMatchObject({ ok: false, busy: true });
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(hourlyAt + 1);
      await runDurableObjectAlarm(scheduler);
      let status = await scheduler.status();
      expect(status.hourlyAt).toBe(hourlyAt);
      expect(status.alarmAt).not.toBeNull();
    } finally {
      release();
    }
    await first;
    let status = await runAlarmUntil(scheduler, s => s.lastRun !== null);
    expect(status.lastRun.updaters.ok).toBe(true);
    expect(status.hourlyAt).toBe(hourlyAt + HOUR_MS);
  });
});

describe('Background manual runs', () => {
  it('persists a request, rejects overlap, and runs data without posting', async () => {
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const renders = network({ beforeRequest: () => gate });
    const scheduler = stub();
    const { hourlyAt } = await scheduler.ensureArmed();
    const result = await scheduler.startManual('data');
    expect(result).toMatchObject({ ok: true, run: { mode: 'data', status: 'queued' } });
    try {
      expect((await scheduler.status()).pendingManual.id).toBe(result.run.id);
      expect(await scheduler.startManual('social')).toMatchObject({ ok: false, busy: true });
      expect(await scheduler.run()).toMatchObject({ ok: false, busy: true });
      expect(await scheduler.pause()).toMatchObject({ ok: false, busy: true });
    } finally { release(); }
    const status = await runAlarmUntil(scheduler, s => !!s.lastManualRun);
    expect(status.lastManualRun).toMatchObject({ id: result.run.id, ok: true, status: 'succeeded', social: { skipped: true } });
    expect(status.pendingManual).toBeNull();
    expect(status.activeRun).toBeNull();
    expect(status.lastManualRun.logs.lines.some(line => line.text.includes('Done.'))).toBe(true);
    expect(status.hourlyAt).toBe(hourlyAt);
    expect(renders).toHaveLength(0);
  });
  it('runs social from the published data without invoking SplatNet again', async () => {
    network();
    const scheduler = stub();
    await scheduler.startManual('data');
    await runAlarmUntil(scheduler, s => !!s.lastManualRun);
    const requests = vi.fn();
    const renders = network({ beforeRequest: requests });
    const { run } = await scheduler.startManual('social');
    const status = await runAlarmUntil(scheduler, s => s.lastManualRun?.id === run.id);
    expect(status.lastManualRun).toMatchObject({ ok: true, updaters: { skipped: true }, social: { ok: true } });
    expect(requests).not.toHaveBeenCalled();
    expect(renders.length).toBeGreaterThan(0);
  });
  it('reports an interrupted run instead of automatically replaying an uncertain post', async () => {
    const scheduler = stub();
    const renders = network();
    await scheduler.ensureArmed();
    await runInDurableObject(scheduler, async (instance, state) => {
      await state.storage.put('pendingManual', { id: 'interrupted', mode: 'social', status: 'running', startedAt: Date.now() - 1000 });
    });
    await scheduler.ensureArmed();
    const status = await runAlarmUntil(scheduler, s => !!s.lastManualRun);
    expect(status.lastManualRun).toMatchObject({ id: 'interrupted', ok: false, status: 'failed' });
    expect(status.lastManualRun.error).toContain('interrupted');
    expect(renders).toHaveLength(0);
    expect(status.pendingManual).toBeNull();
  });
  it('still performs an hourly cycle that became due alongside a manual request', async () => {
    network();
    const scheduler = stub();
    const { hourlyAt } = await scheduler.ensureArmed();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(hourlyAt + 1);
    await runInDurableObject(scheduler, async (instance, state) => {
      await state.storage.put('pendingManual', { id: 'due', mode: 'data', status: 'queued', requestedAt: Date.now() });
    });
    const status = await runAlarmUntil(scheduler, s => !!s.lastRun);
    expect(status.lastManualRun).toMatchObject({ id: 'due', ok: true, mode: 'data' });
    expect(status.lastRun).toMatchObject({ ok: true, mode: 'both', social: { ok: true } });
    expect(status.hourlyAt).toBe(hourlyAt + HOUR_MS);
  });
  it('rejects invalid modes and paused scheduling', async () => {
    const scheduler = stub();
    expect(await scheduler.startManual('anything')).toMatchObject({ ok: false });
    await scheduler.pause();
    expect(await scheduler.startManual('both')).toMatchObject({ ok: false, paused: true });
  });
});

describe('Worker routing', () => {
  it('cron only calls the watchdog', async () => {
    const ensureArmed = vi.fn(async () => ({ armed: true }));
    const fakeEnv = { SCHEDULER: { idFromName: () => 'id', get: () => ({ ensureArmed }) } };
    await worker.scheduled(createScheduledController({ cron: '30 * * * *' }), fakeEnv, createExecutionContext());
    expect(ensureArmed).toHaveBeenCalledOnce();
  });

  it('authenticates manual runs and sends them through the DO with busy/failure HTTP statuses', async () => {
    const run = vi.fn(async () => ({ ok: false, busy: true }));
    const fakeEnv = { RUN_TOKEN: 'test-token', SCHEDULER: { idFromName: () => 'id', get: () => ({ run }) } };
    const request = headers => new Request('https://worker.test/run?only=Schedules,Timeline', { method: 'POST', headers });
    expect((await worker.fetch(request(), fakeEnv, createExecutionContext())).status).toBe(401);
    expect(run).not.toHaveBeenCalled();
    const headers = { Authorization: 'Bearer test-token' };
    expect((await worker.fetch(request(headers), fakeEnv, createExecutionContext())).status).toBe(409);
    expect(run).toHaveBeenCalledWith({ only: ['Schedules', 'Timeline'] });
    run.mockResolvedValue({ ok: false });
    expect((await worker.fetch(request(headers), fakeEnv, createExecutionContext())).status).toBe(502);
    run.mockResolvedValue({ ok: true });
    expect((await worker.fetch(request(headers), fakeEnv, createExecutionContext())).status).toBe(200);
  });
});
