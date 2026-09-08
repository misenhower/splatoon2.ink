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

    return new Response(page.replaceAll('__NONCE__', nonce), {
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

  if (request.method === 'POST' && url.pathname === '/admin/api/run') {
    // Access cookies authenticate the user; require a same-origin JSON request as well.
    if (
      request.headers.get('Origin') !== url.origin ||
      request.headers.get('Content-Type') !== 'application/json'
    )
      return json({ error: 'A same-origin JSON request is required.' }, 403);

    let mode;

    try {
      ({ mode } = await request.json());
    } catch {
      return json({ error: 'Invalid request.' }, 400);
    }

    if (!MANUAL_MODES.includes(mode))
      return json({ error: 'Unknown run mode.' }, 400);

    let result = await getScheduler().startManual(mode);

    return json(result, result.ok ? 202 : result.busy || result.paused ? 409 : 400);
  }

  return json({ error: 'Not found.' }, 404);
}
