import { withSentry, instrumentDurableObjectWithSentry } from '@sentry/cloudflare';
import { runUpdaters } from './updaters.mjs';
import { Scheduler as SchedulerClass } from './Scheduler.mjs';
import { createLogger, describeError } from './log.mjs';

// Sentry: the shared updater code reports through @sentry/core, which lands on the client
// these wrappers set up per invocation. With no SENTRY_DSN secret nothing is sent.
const sentryOptions = env => ({ dsn: env.SENTRY_DSN, tracesSampleRate: 0 });

export const Scheduler = instrumentDurableObjectWithSentry(sentryOptions, SchedulerClass);

// The object is created next to the R2 buckets (western North America). Only the first
// get() for an object honors the hint; after that it stays where it is.
function scheduler(env) {
  return env.SCHEDULER.get(env.SCHEDULER.idFromName('schedules'), { locationHint: 'wnam' });
}

// Cron Triggers never do work themselves: they wake the Scheduler, which runs jobs in
// place. Each entry maps a cron expression from wrangler.jsonc to a call on the object.
const CRON_ACTIONS = {
  '30 * * * *': scheduler => scheduler.ensureArmed(), // watchdog: the hourly alarm must always be armed
  // Example of a cron-driven job: '15 3 * * *': scheduler => scheduler.wake('some-daily-job'),
};

function timingSafeEqual(a, b) {
  let encoder = new TextEncoder;
  let left = encoder.encode(a);
  let right = encoder.encode(b);
  if (left.byteLength !== right.byteLength)
    return false;
  return crypto.subtle.timingSafeEqual(left, right);
}

function isAuthorized(request, env) {
  if (!env.RUN_TOKEN)
    return false;
  let header = request.headers.get('Authorization') ?? '';
  let [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && !!token && timingSafeEqual(token, env.RUN_TOKEN);
}

export default withSentry(sentryOptions, {
  async scheduled(controller, env, ctx) {
    let log = createLogger('cron');
    let action = CRON_ACTIONS[controller.cron];
    if (!action) {
      log.warn('No action for cron expression', { cron: controller.cron });
      return;
    }

    try {
      log.info('Cron action finished', { cron: controller.cron, result: await action(scheduler(env)) });
    } catch (error) {
      log.error('Cron action failed', { cron: controller.cron, ...describeError(error) });
      throw error; // Mark the invocation as failed in Workers metrics
    }
  },

  // Authenticated operator endpoints, "Authorization: Bearer <RUN_TOKEN>":
  //   POST /run[?only=Name,Name]  run the updaters in this invocation and return the summary
  //   POST /wake?job=NAME         ask the Scheduler to run a job as soon as possible
  //   POST /arm                   schedule the hourly job if it is not scheduled
  //   GET  /status                alarm state and the last run of each job
  //   GET  /list?prefix=data/     keys in the public bucket under a prefix (first 1000)
  async fetch(request, env, ctx) {
    let url = new URL(request.url);
    let route = `${request.method} ${url.pathname}`;
    if (!['POST /run', 'POST /wake', 'POST /arm', 'GET /status', 'GET /list'].includes(route))
      return new Response('Not found', { status: 404 });
    if (!isAuthorized(request, env))
      return new Response('Unauthorized', { status: 401 });

    try {
      switch (route) {
        case 'POST /run': {
          let only = url.searchParams.get('only')?.split(',').map(name => name.trim()).filter(Boolean);
          return Response.json(await runUpdaters(env, { only }));
        }
        case 'POST /wake': {
          let woke = await scheduler(env).wake(url.searchParams.get('job') ?? '');
          return Response.json({ ok: woke.accepted, ...woke }, { status: woke.accepted ? 200 : 400 });
        }
        case 'POST /arm':
          return Response.json({ ok: true, ...await scheduler(env).ensureArmed() });
        case 'GET /status':
          return Response.json({ ok: true, ...await scheduler(env).status() });
        case 'GET /list': {
          let listing = await env.ASSETS.list({ prefix: url.searchParams.get('prefix') ?? '', limit: 1000 });
          return Response.json({ ok: true, truncated: listing.truncated, keys: listing.objects.map(object => ({ key: object.key, size: object.size, uploaded: object.uploaded })) });
        }
      }
    } catch (error) {
      createLogger('http').error(`${route} failed`, describeError(error));
      return Response.json({ ok: false, ...describeError(error) }, { status: 500 });
    }
  },
});
