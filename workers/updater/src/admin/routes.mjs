import page from './page.html';
import { verifyAccess } from './access.mjs';
import { MANUAL_MODES } from '../Scheduler.mjs';

const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (body, status = 200) => Response.json(body, { status, headers });

export async function adminRequest(request, env, getScheduler) {
  let user = await verifyAccess(request, env);

  if (!user)
    return json({ error: 'Sign in through Cloudflare Access to continue.' }, 401);

  let url = new URL(request.url);

  if (request.method === 'GET' && ['/', '/admin', '/admin/'].includes(url.pathname)) {
    let nonce = crypto.randomUUID();

    const staging = new URL(env.SITE_URL || request.url).hostname.startsWith('dev.');
    const html = page.replaceAll('__NONCE__', nonce)
      .replaceAll('__STAGING_HIDDEN__', staging ? '' : 'hidden');

    return new Response(html, {
      headers: {
        ...headers,
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`,
        'Referrer-Policy': 'no-referrer',
      },
    });
  }

  if (request.method === 'GET' && url.pathname === '/admin/api/status')
    return json({ ...(await getScheduler().status()), user, preview: false });

  if (request.method === 'POST' && ['/admin/api/run', '/admin/api/scheduling'].includes(url.pathname)) {
    // Access cookies authenticate the user; require a same-origin JSON request as well.
    if (
      request.headers.get('Origin') !== url.origin ||
      request.headers.get('Content-Type') !== 'application/json'
    )
      return json({ error: 'A same-origin JSON request is required.' }, 403);

    let body;

    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid request.' }, 400);
    }

    if (url.pathname === '/admin/api/scheduling') {
      if (typeof body?.enabled !== 'boolean')
        return json({ error: 'Enabled must be a boolean.' }, 400);

      let result = await getScheduler().setAutomaticScheduling(body.enabled);

      return json(result, result.ok ? 200 : result.busy || result.paused ? 409 : 400);
    }

    let mode = body?.mode;

    if (!MANUAL_MODES.includes(mode))
      return json({ error: 'Unknown run mode.' }, 400);

    let result = await getScheduler().startManual(mode);

    return json(result, result.ok ? 202 : result.busy || result.paused ? 409 : 400);
  }

  return json({ error: 'Not found.' }, 404);
}
