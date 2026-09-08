// UI preview only. No Worker bindings, credentials, or production network requests.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const port = Number(process.env.ADMIN_PREVIEW_PORT || 8788);
const hour = Math.floor(Date.now() / 3600000) * 3600000;
const state = {
  preview: true,
  user: { email: 'Local preview' },
  paused: false,
  busy: false,
  hourlyAt: hour + 3600000 + 10000,
  retryAt: null,
  pendingManual: null,
  lastManualRun: {
    logs: {
      lines: [
        { at: hour - 1800000, level: 'info', text: 'Starting social cycle' },
        {
          at: hour - 1757700,
          level: 'error',
          text: 'Browser screenshot timed out. The post was not sent.',
        },
      ],
      omitted: 0,
    },
    id: 'previous',
    mode: 'social',
    ok: false,
    status: 'failed',
    startedAt: hour - 1800000,
    runMs: 42300,
    error: 'Browser screenshot timed out. The post was not sent.',
  },
  lastRun: {
    mode: 'both',
    ok: true,
    startedAt: hour + 10000,
    runMs: 18200,
    updaters: { ok: true },
    social: { ok: true },
  },
};

createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');

  const url = new URL(request.url, `http://127.0.0.1:${port}`);

  function json(body, status = 200) {
    response.writeHead(status, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(body));
  }

  try {
    if (request.method === 'GET' && ['/', '/admin', '/admin/'].includes(url.pathname)) {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

      return response.end(
        (await readFile(new URL('../src/admin/page.html', import.meta.url), 'utf8')).replaceAll(
          '__NONCE__',
          'preview',
        ),
      );
    }

    if (request.method === 'GET' && url.pathname === '/admin/api/status')
      return json(state);

    if (request.method === 'POST' && url.pathname === '/admin/api/run') {
      if (request.headers.origin !== `http://${request.headers.host}`)
        return json({ error: 'Invalid origin.' }, 403);

      if (state.busy)
        return json({ error: 'A run is already active.' }, 409);

      let body = '';

      for await (const chunk of request) {
        body += chunk;

        if (body.length > 1024)
          return json({ error: 'Request too large.' }, 413);
      }

      const { mode } = JSON.parse(body);

      if (!['data', 'social', 'both'].includes(mode))
        return json({ error: 'Unknown mode.' }, 400);

      const run = { id: randomUUID(), mode, status: 'queued', requestedAt: Date.now() };

      state.busy = true;
      state.pendingManual = run;

      const logs = {
        lines: [{ at: Date.now(), level: 'info', text: `Starting ${mode} run` }],
        omitted: 0,
      };

      state.activeRun = { mode, startedAt: Date.now(), logs };
      setTimeout(
        () =>
          logs.lines.push({
            at: Date.now(),
            level: 'info',
            text:
              mode === 'social'
                ? '[Social] Checking post checkpoints…'
                : '[Updater] [Schedules] Updating data…',
          }),
        1500,
      );
      setTimeout(
        () =>
          logs.lines.push({
            at: Date.now(),
            level: 'info',
            text:
              mode === 'social' ? '[Social] Preparing a due Bluesky post…' : '[Updater] [Schedules] Done.',
          }),
        3200,
      );
      setTimeout(
        () =>
          logs.lines.push({
            at: Date.now(),
            level: 'info',
            text: '[Preview] Simulated work completed.',
          }),
        5000,
      );
      setTimeout(() => {
        run.status = 'running';
        run.startedAt = Date.now();
      }, 700);
      setTimeout(() => {
        state.lastManualRun = {
          ...run,
          logs,
          ok: true,
          status: 'succeeded',
          finishedAt: Date.now(),
          runMs: Date.now() - run.startedAt,
          updaters:
            mode === 'social'
              ? { ok: true, skipped: true }
              : {
                ok: true,
                updaters: ['Schedules', 'Timeline', 'CoopSchedules', 'Merchandises'].map(name => ({
                  name,
                  ok: true,
                })),
              },
          social:
            mode === 'data'
              ? { ok: true, skipped: true }
              : { ok: true, posts: [{ name: 'Schedule', ok: true, simulated: true }] },
        };
        state.busy = false;
        state.pendingManual = null;
        state.activeRun = null;
      }, 6000);

      return json({ ok: true, run }, 202);
    }

    json({ error: 'Not found.' }, 404);
  } catch {
    json({ error: 'Invalid preview request.' }, 400);
  }
}).listen(port, '127.0.0.1', () =>
  console.log(`Admin preview: http://127.0.0.1:${port}/admin/ (simulated runs only)`),
);
