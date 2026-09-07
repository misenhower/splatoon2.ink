import { afterEach, describe, expect, it, vi } from 'vitest';
import { createExecutionContext, createScheduledController, env, runDurableObjectAlarm } from 'cloudflare:test';
import worker from './src/index.mjs';
import { nextRunAt, GRACE_MS, HOUR_MS } from './src/schedule.mjs';

function stub() {
  return env.SCHEDULER.get(env.SCHEDULER.idFromName(`test-${crypto.randomUUID()}`));
}

// In the test runtime a due alarm may fire on its own (the fake Date is visible to the
// runtime too), so trigger it explicitly and then wait for the outcome either way.
async function runAlarmUntil(scheduler, done) {
  await runDurableObjectAlarm(scheduler);
  await vi.waitFor(async () => expect(done(await scheduler.status())).toBe(true), { timeout: 5000 });
  return scheduler.status();
}

import { fakeSplatNet, setSessionEnvironment } from './fakeSplatNet.mjs';

setSessionEnvironment();

// The Durable Object runs in the test isolate, so stubbing global fetch (and Date) reaches it.
function splatnetDown() {
  vi.stubGlobal('fetch', async () => new Response('down', { status: 503 }));
}

function splatnetUp() {
  vi.stubGlobal('fetch', fakeSplatNet());
}

describe('Scheduler', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('schedules the hourly job for the next :00:10 and is idempotent', async () => {
    let scheduler = stub();
    let before = Date.now();
    let first = await scheduler.ensureArmed();

    expect(first.armed).toBe(true);
    expect(first.hourlyAt).toBeGreaterThanOrEqual(nextRunAt(before));
    expect((first.hourlyAt - GRACE_MS) % HOUR_MS).toBe(0);
    expect(first.alarmAt).toBe(first.hourlyAt);

    let second = await scheduler.ensureArmed();
    expect(second).toEqual({ armed: false, hourlyAt: first.hourlyAt, alarmAt: first.hourlyAt });

    let status = await scheduler.status();
    expect(status.alarmAt).toBe(first.hourlyAt);
    expect(status.pending).toEqual([]);
    expect(status.lastRuns).toEqual({});
  });

  it('runs a woken job immediately and then goes back to the hourly schedule', async () => {
    splatnetUp();
    let scheduler = stub();
    let { hourlyAt } = await scheduler.ensureArmed();

    let woke = await scheduler.wake('updaters');
    expect(woke.accepted).toBe(true);
    expect(woke.alarmAt).toBeLessThan(hourlyAt);
    expect(woke.alarmAt - Date.now()).toBeLessThan(1000);
    await scheduler.wake('updaters'); // duplicate collapses into the same run

    let status = await runAlarmUntil(scheduler, s => s.lastRuns.updaters !== undefined);
    expect(status.pending).toEqual([]);
    expect(status.lastRuns.updaters.reason).toBe('wake');
    expect(status.lastRuns.updaters.ok).toBe(true);
    expect(status.lastRuns.updaters.driftMs).toBeNull();
    expect(status.lastRuns.updaters.result.updaters).toHaveLength(8);
    expect(status.hourlyAt).toBe(hourlyAt); // a wake run does not move the hourly schedule
    expect(status.alarmAt).toBe(hourlyAt);
  });

  it('restores the hourly schedule if a wake runs before the object was ever armed', async () => {
    splatnetUp();
    let scheduler = stub();
    await scheduler.wake('updaters');

    let status = await runAlarmUntil(scheduler, s => s.lastRuns.updaters !== undefined);
    expect(status.lastRuns.updaters.ok).toBe(true);
    expect(status.hourlyAt).toBe(nextRunAt(status.lastRuns.updaters.firedAt));
    expect(status.alarmAt).toBe(status.hourlyAt);
  });

  it('rejects unknown jobs without scheduling anything', async () => {
    let scheduler = stub();
    expect(await scheduler.wake('nope')).toEqual({ job: 'nope', accepted: false, error: 'Unknown job: nope' });
    expect((await scheduler.status()).alarmAt).toBeNull();
  });

  it('retries a failed hourly run after a minute, then gives up until the next hour', async () => {
    splatnetDown();
    let scheduler = stub();
    let { hourlyAt } = await scheduler.ensureArmed();

    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(hourlyAt + 5);
    let status = await runAlarmUntil(scheduler, s => s.retries === 1);
    expect(status.lastRuns.updaters).toMatchObject({ reason: 'hourly', ok: false, retries: 0 });
    expect(status.lastRuns.updaters.driftMs).toBeGreaterThanOrEqual(5);
    expect(status.lastRuns.updaters.driftMs).toBeLessThan(1000); // the faked clock still creeps a little
    expect(status.lastRuns.updaters.error).toContain('updaters failed');
    expect(status.retries).toBe(1);
    expect(status.retryAt - (hourlyAt + 5 + 60 * 1000)).toBeGreaterThanOrEqual(0);
    expect(status.retryAt - (hourlyAt + 5 + 60 * 1000)).toBeLessThan(2000);
    expect(status.alarmAt).toBe(status.retryAt);
    expect(status.hourlyAt).toBe(hourlyAt);

    for (let attempt = 2; attempt <= 3; attempt++) {
      vi.setSystemTime(status.retryAt);
      status = await runAlarmUntil(scheduler, s => s.retries === attempt);
      expect(status.lastRuns.updaters.reason).toBe('retry');
    }

    // Fourth failure exhausts retries: back to the next hour
    vi.setSystemTime(status.retryAt);
    status = await runAlarmUntil(scheduler, s => s.retryAt === null);
    expect(status.retries).toBe(0);
    expect(status.hourlyAt).toBe(hourlyAt + HOUR_MS);
    expect(status.alarmAt).toBe(hourlyAt + HOUR_MS);
  });

  it('moves to the next hour after a successful hourly run', async () => {
    splatnetUp();
    let scheduler = stub();
    let { hourlyAt } = await scheduler.ensureArmed();

    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(hourlyAt + 1);
    let status = await runAlarmUntil(scheduler, s => s.hourlyAt !== hourlyAt);
    expect(status.lastRuns.updaters).toMatchObject({ reason: 'hourly', ok: true, colo: 'TEST' });
    expect(status.lastRuns.posters).toMatchObject({ reason: 'hourly', ok: true });
    expect(status.lastRuns.updaters.driftMs).toBeGreaterThanOrEqual(1);
    expect(status.lastRuns.updaters.driftMs).toBeLessThan(1000);
    expect(status.hourlyAt).toBe(hourlyAt + HOUR_MS);
    expect(status.alarmAt).toBe(hourlyAt + HOUR_MS);
  });
});

describe('cron watchdog', () => {
  it('arms the scheduler and does nothing else', async () => {
    let calls = [];
    let fakeEnv = {
      SCHEDULER: {
        idFromName: name => ({ name }),
        get: (id, options) => {
          calls.push({ id, options });
          return { ensureArmed: async () => ({ armed: true, hourlyAt: 1, alarmAt: 1 }) };
        },
      },
    };
    await worker.scheduled(createScheduledController({ cron: '30 * * * *', scheduledTime: new Date }), fakeEnv, createExecutionContext());
    expect(calls).toEqual([{ id: { name: 'schedules' }, options: { locationHint: 'wnam' } }]);
  });

  it('ignores cron expressions it has no action for', async () => {
    let fakeEnv = { SCHEDULER: { idFromName: () => ({}), get: () => { throw new Error('should not be called'); } } };
    await expect(worker.scheduled(createScheduledController({ cron: '0 0 1 1 *', scheduledTime: new Date }), fakeEnv, createExecutionContext())).resolves.toBeUndefined();
  });
});
