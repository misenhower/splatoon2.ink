import { createRunLog, logMessage } from '../../../src/app/log.js';
// One owner for the hourly update → social pipeline and authenticated manual runs.
// The alarm targets :00:10; the cron watchdog repairs a missing alarm. Alarms can be late.
import { DurableObject } from 'cloudflare:workers';
import { runUpdaters } from './updaters.mjs';
import { runPosters } from './posters.mjs';
import { nextRunAt } from './schedule.mjs';
import { createLogger, describeError } from './log.mjs';

const RETRY_DELAY_MS = 60 * 1000;
const MAX_RETRIES = 3;
export const MANUAL_MODES = ['data', 'social', 'both'];

export class Scheduler extends DurableObject {
  // Set synchronously before any await. RPCs may interleave with an alarm during external
  // I/O. This is a lock, not durable job state: interrupted RPC callers receive an error,
  // and interrupted alarms are retried by Cloudflare using the persisted schedule.
  #running = false;
  #activeRun = null;

  async #state() {
    let saved = await this.ctx.storage.get('state') ?? {};
    // Retain the existing hourly/retry schedule across deployment. Any old pending wake
    // becomes one immediate full run, then the generic queue is retired.
    return {
      paused: saved.paused ?? false,
      hourlyAt: saved.hourlyAt ?? null,
      retryAt: saved.retryAt ?? (saved.pending?.length ? Date.now() : null),
      retries: saved.retries ?? 0,
      lastRun: saved.lastRun ?? null,
    };
  }

  async #pendingManual() {
    return await this.ctx.storage.get('pendingManual') ?? null;
  }

  async ensureArmed() {
    if (this.#running)
      return { armed: false, busy: true };
    let state = await this.#state();
    if (state.paused)
      return { armed: false, paused: true };
    let armed = await this.ctx.storage.getAlarm() === null;
    state.hourlyAt ??= nextRunAt();
    await this.ctx.storage.put('state', state);
    let alarmAt = await this.#pendingManual() ? Date.now() : state.retryAt ?? state.hourlyAt;
    await this.ctx.storage.setAlarm(alarmAt);
    return { armed, hourlyAt: state.hourlyAt, alarmAt };
  }

  async pause() {
    if (this.#running || await this.#pendingManual())
      return { ok: false, busy: true, error: 'Wait for the current run to finish before pausing.' };
    let state = await this.#state();
    state.paused = true;
    await this.ctx.storage.put('state', state);
    await this.ctx.storage.deleteAlarm();
    return { ok: true, paused: true };
  }

  async resume() {
    if (this.#running)
      return { ok: false, busy: true };
    let state = await this.#state();
    state.paused = false;
    await this.ctx.storage.put('state', state);
    return { ok: true, ...await this.ensureArmed() };
  }

  async status() {
    return {
      ...await this.#state(),
      alarmAt: await this.ctx.storage.getAlarm(),
      lastManualRun: await this.ctx.storage.get('lastManualRun') ?? null,
      pendingManual: await this.#pendingManual(),
      activeRun: this.#activeRun,
      busy: this.#running || !!await this.#pendingManual(),
    };
  }

  // One persisted manual request, executed by the alarm independently of the HTTP client.
  async startManual(mode) {
    if (!MANUAL_MODES.includes(mode))
      return { ok: false, error: 'Unknown run mode.' };
    if (this.#running)
      return { ok: false, busy: true, error: 'A run is already active.' };
    this.#running = true;
    try {
      if (await this.#pendingManual())
        return { ok: false, busy: true, error: 'A manual run is already active.' };
      if ((await this.#state()).paused)
        return { ok: false, paused: true, error: 'Scheduler is paused.' };
      let run = { id: crypto.randomUUID(), mode, status: 'queued', requestedAt: Date.now() };
      await this.ctx.storage.transaction(async txn => {
        await txn.put('pendingManual', run);
        await txn.setAlarm(Date.now());
      });
      return { ok: true, run };
    } finally {
      this.#running = false;
    }
  }

  // Synchronous API callers retain their existing behavior. A busy caller gets an explicit response
  // and can retry; a successful response means the requested work finished.
  async run({ only } = {}) {
    if (this.#running)
      return { ok: false, busy: true, error: 'An update is already running; retry later.' };
    this.#running = true;
    try {
      if (await this.#pendingManual())
        return { ok: false, busy: true, error: 'A manual run is already active.' };
      if ((await this.#state()).paused)
        return { ok: false, paused: true, error: 'Scheduler is paused; use /arm to resume.' };
      let result = await this.#execute(only);
      await this.ctx.storage.put('lastManualRun', result);
      return result;
    } finally {
      this.#running = false;
      await this.ensureArmed();
    }
  }

  async #execute(only, mode = 'both') {
    const secrets = Object.entries({ ...process.env, ...this.env })
      .filter(([key]) => /TOKEN|PASSWORD|SESSION|ACCOUNT_ID|SECRET/.test(key))
      .map(([, value]) => value);
    const capture = createRunLog(secrets);
    this.#activeRun = { mode, startedAt: Date.now(), logs: capture.snapshot };
    try {
      return await capture.run(async () => {
        logMessage('info', `Starting ${mode === 'both' ? 'full cycle' : mode === 'data' ? 'data update' : 'social cycle'}`);
        const result = await this.#executeWithLogs(only, mode);
        return { ...result, logs: capture.snapshot };
      });
    } finally {
      this.#activeRun = null;
    }
  }

  async #executeWithLogs(only, mode) {
    let startedAt = Date.now();
    let result;
    try {
      let updaters = mode === 'social'
        ? { ok: true, skipped: true }
        : await runUpdaters(this.env, { only });
      // A targeted repair does not publish social posts from a partially refreshed dataset.
      let social = !updaters.ok || only || mode === 'data'
        ? { ok: true, skipped: true, reason: mode === 'data' ? 'data-only' : only ? 'targeted-update' : 'updater-failed' }
        : await runPosters(this.env);
      result = { ok: updaters.ok && social.ok, updaters, social };
    } catch (error) {
      result = { ok: false, ...describeError(error) };
    }
    result = { ...result, mode, startedAt, runMs: Date.now() - startedAt };
    createLogger('pipeline')[result.ok ? 'info' : 'error']('Run finished', result);
    return result;
  }

  async alarm(alarmInfo) {
    if (this.#running) {
      // A manual run must not make us skip this hour. Leave the original due time intact.
      await this.ctx.storage.setAlarm(Date.now() + RETRY_DELAY_MS);
      return;
    }
    this.#running = true;
    try {
      let state = await this.#state();
      if (state.paused) {
        await this.ctx.storage.deleteAlarm();
        return;
      }
      let manual = await this.#pendingManual();
      if (manual) {
        let result;
        if (manual.status === 'running') {
          // After an isolate interruption, do not automatically replay an uncertain social
          // send. Show the interruption and let the operator retry with normal checkpoints.
          result = { ok: false, error: 'Run interrupted. Review the result before retrying.', startedAt: manual.startedAt, runMs: Date.now() - manual.startedAt };
        } else {
          manual = { ...manual, status: 'running', startedAt: Date.now() };
          await this.ctx.storage.put('pendingManual', manual);
          result = await this.#execute(undefined, manual.mode);
        }
        await this.ctx.storage.transaction(async txn => {
          await txn.put('lastManualRun', { ...manual, ...result, status: result.ok ? 'succeeded' : 'failed', finishedAt: Date.now() });
          await txn.delete('pendingManual');
        });
      }
      state.hourlyAt ??= nextRunAt();
      let scheduledFor = state.retryAt ?? state.hourlyAt;
      if (Date.now() >= scheduledFor) {
        let result = await this.#execute();
        state.lastRun = {
          ...result, scheduledFor,
          driftMs: result.startedAt - scheduledFor,
          retries: state.retries,
          retryCount: alarmInfo?.retryCount ?? 0,
        };
        if (result.ok || state.retries >= MAX_RETRIES) {
          state.hourlyAt = nextRunAt();
          state.retryAt = null;
          state.retries = 0;
        } else {
          state.retryAt = Date.now() + RETRY_DELAY_MS;
          state.retries++;
        }
      }
      // Storage failures escape so the platform retries. Schedule and state are saved
      // together without external I/O in between.
      await this.ctx.storage.put('state', state);
      await this.ctx.storage.setAlarm(state.retryAt ?? state.hourlyAt);
    } finally {
      this.#running = false;
    }
  }
}
