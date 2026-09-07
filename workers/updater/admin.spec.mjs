import { expect, it, vi, afterEach } from 'vitest';
import { adminRequest } from './src/admin/routes.mjs';
import { verifyAccess } from './src/admin/access.mjs';
vi.mock('./src/admin/access.mjs', () => ({ verifyAccess: vi.fn() }));
afterEach(() => vi.resetAllMocks());
const url = 'https://admin.example.test';
const post = (mode = 'both', origin = url) =>
  new Request(url + '/admin/api/run', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  });

it('requires Access before exposing the panel, status or actions', async () => {
  verifyAccess.mockResolvedValue(null);
  const get = vi.fn();
  for (const request of [
    new Request(url + '/'),
    new Request(url + '/admin/'),
    new Request(url + '/admin/api/status'),
    post(),
  ])
    expect((await adminRequest(request, {}, get)).status).toBe(401);
  expect(get).not.toHaveBeenCalled();
});
it('rejects cross-origin requests and unknown modes before scheduling work', async () => {
  verifyAccess.mockResolvedValue({ email: 'admin@example.test' });
  const get = vi.fn();
  expect((await adminRequest(post('both', 'https://other.test'), {}, get)).status).toBe(403);
  expect((await adminRequest(post('force'), {}, get)).status).toBe(400);
  expect(get).not.toHaveBeenCalled();
});
it('returns an accepted run immediately and reports overlap without starting another', async () => {
  verifyAccess.mockResolvedValue({ email: 'admin@example.test' });
  const startManual = vi.fn(async (mode) => ({
    ok: true,
    run: { id: 'one', mode, status: 'queued' },
  }));
  expect((await adminRequest(post('social'), {}, () => ({ startManual }))).status).toBe(202);
  expect(startManual).toHaveBeenCalledWith('social');
  startManual.mockResolvedValue({ ok: false, busy: true });
  expect((await adminRequest(post(), {}, () => ({ startManual }))).status).toBe(409);
});
it.each(['/', '/admin/'])('serves the mobile panel at %s with no-store and a nonce-based content policy', async (path) => {
  verifyAccess.mockResolvedValue({ email: 'admin@example.test' });
  const response = await adminRequest(new Request(url + path), {}, vi.fn());
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('content-security-policy')).toContain('frame-ancestors \'none\'');
  expect(await response.text()).not.toContain('__NONCE__');
});
