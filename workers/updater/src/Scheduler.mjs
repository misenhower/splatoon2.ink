// Durable Object that owns *when* and *where* updater jobs run.
//
// Why a Durable Object: Cron Triggers fire anywhere inside their minute and execute in
// whichever colo Cloudflare picks (placement hints only apply to fetch handlers). An
// object's alarm fires within milliseconds, and the object stays in the colo it was
// created in, next to the R2 buckets. So the cron trigger only wakes the object; the
// object does the work.
//
// Two ways work gets scheduled:
//   - the hourly job re-arms itself for the next :00:10 after every run;
//   - wake(job) asks for a job to run as soon as possible (used by cron-driven jobs).
// Both share one alarm: it is always set to the earliest thing that is due.

import { DurableObject } from 'cloudflare:workers';
import { runUpdaters } from './updaters.mjs';
import { nextRunAt } from './schedule.mjs';
import { createLogger, describeError } from './log.mjs';
import { currentColo } from './colo.mjs';

const RETRY_DELAY_MS = 60 * 1000;
const MAX_RETRIES = 3;

export const HOURLY_JOB = 'updaters';

// Jobs the object can run. The hourly job is the full updater run; more can be added here.
const JOBS = {
  updaters: env => runUpdaters(env),
};

const EMPTY_STATE = {
  hourlyAt: null,  // next scheduled run of the hourly job
  retryAt: null,   // when set, a failed hourly run is retried at this time instead
  retries: 0,
  pending: [],     // jobs requested through wake(), run at the next alarm
  lastRuns: {},    // per job: timing and outcome of the most recent run
};

export class Scheduler extends DurableObject {
  /** Schedule the hourly job if it is not scheduled yet. Safe to call repeatedly (the cron watchdog does). */
  async ensureArmed() {
    let state = await this.#state();
    let armed = state.hourlyAt === null;
    if (armed) {
      state.hourlyAt = nextRunAt(Date.now());
      await this.#save(state);
    }
    return { armed, hourlyAt: state.hourlyAt, alarmAt: await this.#rearm(state) };
  }

  /** Run a job as soon as possible. Duplicate requests before the run collapse into one. */
  async wake(job) {
    if (!Object.hasOwn(JOBS, job))
      return { job, accepted: false, error: `Unknown job: ${job}` };
    let state = await this.#state();
    if (!state.pending.includes(job))
      state.pending.push(job);
    await this.#save(state);
    return { job, accepted: true, alarmAt: await this.#rearm(state) };
  }

  async status() {
    return { alarmAt: await this.ctx.storage.getAlarm(), ...await this.#state() };
  }

  async #state() {
    return { ...EMPTY_STATE, ...await this.ctx.storage.get('state') ?? {} };
  }

  async #save(state) {
    await this.ctx.storage.put('state', state);
  }

  /** Point the single alarm at the earliest due time. */
  async #rearm(state) {
    let candidates = [state.retryAt ?? state.hourlyAt, state.pending.length ? Date.now() : null]
      .filter(time => time !== null);
    if (!candidates.length)
      return null;
    let alarmAt = Math.min(...candidates);
    await this.ctx.storage.setAlarm(alarmAt);
    return alarmAt;
  }

  async alarm(alarmInfo) {
    let firedAt = Date.now();
    let log = createLogger('alarm');
    let colo = await currentColo();
    let state = await this.#state();

    // Work out what is due. The hourly job is due when its time (or its retry time) has come;
    // pending jobs are due now. A pending request for the hourly job merges into the hourly run.
    let due = [];
    let hourlyScheduledFor = state.retryAt ?? state.hourlyAt;
    if (hourlyScheduledFor !== null && firedAt >= hourlyScheduledFor)
      due.push({ job: HOURLY_JOB, reason: state.retryAt ? 'retry' : 'hourly', scheduledFor: hourlyScheduledFor });
    for (let job of state.pending)
      if (Object.hasOwn(JOBS, job) && !due.some(entry => entry.job === job))
        due.push({ job, reason: 'wake', scheduledFor: null });
    state.pending = [];

    for (let { job, reason, scheduledFor } of due) {
      let startedAt = Date.now();
      let run = {
        job,
        reason,
        scheduledFor,
        firedAt,
        driftMs: scheduledFor === null ? null : firedAt - scheduledFor,
        retryCount: alarmInfo?.retryCount ?? 0,
        retries: state.retries,
        colo,
      };

      // Errors are caught so the alarm is always re-armed; the platform's own alarm retries are
      // capped and only cover the latest setAlarm(), so hourly retries are managed here.
      try {
        let result = await JOBS[job](this.env);
        // A job reports partial failure by returning { ok: false } rather than throwing
        run = { ...run, ok: result?.ok !== false, runMs: Date.now() - startedAt, result };
        if (!run.ok)
          run.error = `${job} failed: ${result.updaters?.filter(u => !u.ok).map(u => u.name).join(', ')}`;
      } catch (error) {
        run = { ...run, ok: false, runMs: Date.now() - startedAt, ...describeError(error) };
      }

      if (job === HOURLY_JOB && reason !== 'wake') {
        if (run.ok || state.retries >= MAX_RETRIES) {
          state.hourlyAt = nextRunAt(Date.now());
          state.retryAt = null;
          state.retries = 0;
        } else {
          state.retryAt = Date.now() + RETRY_DELAY_MS;
          state.retries += 1;
        }
      }

      state.lastRuns[job] = run;
      log[run.ok ? 'info' : 'error']('Alarm run finished', run);
    }

    // This instance always owns the hourly job. If it has somehow been lost (for example the
    // alarm was consumed by a wake before ensureArmed() ever ran), restore it here rather than
    // waiting for the cron watchdog.
    if (state.hourlyAt === null) {
      state.hourlyAt = nextRunAt(Date.now());
      log.warn('Hourly schedule was missing; restored', { hourlyAt: state.hourlyAt });
    }

    await this.#save(state);
    let alarmAt = await this.#rearm(state);
    log.info('Alarm re-armed', { alarmAt, hourlyAt: state.hourlyAt, retryAt: state.retryAt, ran: due.map(entry => entry.job) });
  }
}
