import { adminRequest } from './admin/routes.mjs';
import { withSentry, instrumentDurableObjectWithSentry } from '@sentry/cloudflare';
import { Scheduler as SchedulerClass } from './Scheduler.mjs';
import { createLogger, describeError } from './log.mjs';

// Sentry: the shared updater code reports through @sentry/core, which lands on the client
// these wrappers set up per invocation. With no SENTRY_DSN secret nothing is sent.
const sentryOptions = env => ({ dsn: env.SENTRY_DSN, tracesSampleRate: 0 });

export const Scheduler = instrumentDurableObjectWithSentry(sentryOptions, SchedulerClass);

// Best-effort initial placement near the buckets; correctness does not depend on it.
function scheduler(env) {
  return env.SCHEDULER.get(env.SCHEDULER.idFromName('schedules'), { locationHint: 'wnam' });
}

function timingSafeEqual(a, b) {
  let encoder = new TextEncoder();
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

    try {
      log.info('Cron action finished', { cron: controller.cron, result: await scheduler(env).ensureArmed() });
    } catch (error) {
      log.error('Cron action failed', { cron: controller.cron, ...describeError(error) });
      throw error; // Mark the invocation as failed in Workers metrics
    }
  },

  // Manual runs use the same owner as alarms. Targeted runs refresh data only.
  async fetch(request, env, ctx) {
    let url = new URL(request.url);

    if (
      (url.hostname === env.ADMIN_HOSTNAME && url.pathname === '/') ||
      url.pathname === '/admin' ||
      url.pathname.startsWith('/admin/')
    ) {
      try {
        return await adminRequest(request, env, () => scheduler(env));
      } catch (error) {
        createLogger('admin').error('Admin request failed', describeError(error));

        return Response.json(
          { error: 'The request failed. Refresh status before retrying.' },
          { status: 500, headers: { 'Cache-Control': 'no-store' } },
        );
      }
    }

    let route = `${request.method} ${url.pathname}`;

    if (!['POST /run', 'POST /arm', 'POST /pause', 'GET /status', 'GET /list'].includes(route))
      return new Response('Not found', { status: 404 });

    if (!isAuthorized(request, env))
      return new Response('Unauthorized', { status: 401 });

    try {
      switch (route) {
        case 'POST /run': {
          let only = url.searchParams
            .get('only')
            ?.split(',')
            .map(name => name.trim())
            .filter(Boolean);
          let result = await scheduler(env).run({ only });

          return Response.json(result, {
            status: result.busy || result.paused ? 409 : result.ok ? 200 : 502,
          });
        }

        case 'POST /arm': {
          let result = await scheduler(env).resume();

          return Response.json(result, { status: result.busy ? 409 : 200 });
        }

        case 'POST /pause': {
          let result = await scheduler(env).pause();

          return Response.json(result, { status: result.busy ? 409 : 200 });
        }

        case 'GET /status':
          return Response.json({ ok: true, ...(await scheduler(env).status()) });

        case 'GET /list': {
          let listing = await env.ASSETS.list({ prefix: url.searchParams.get('prefix') ?? '', limit: 1000 });

          return Response.json({
            ok: true,
            truncated: listing.truncated,
            keys: listing.objects.map(object => ({
              key: object.key,
              size: object.size,
              uploaded: object.uploaded,
            })),
          });
        }
      }
    } catch (error) {
      createLogger('http').error(`${route} failed`, describeError(error));

      return Response.json({ ok: false, ...describeError(error) }, { status: 500 });
    }
  },
});
