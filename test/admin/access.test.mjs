import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, SignJWT } from 'jose';
import { verifyAccess } from '../../workers/updater/src/admin/access.mjs';

const { publicKey, privateKey } = await generateKeyPair('RS256');
const env = { ADMIN_HOSTNAME: 'admin.example.test', ACCESS_TEAM_DOMAIN: 'example.cloudflareaccess.com', ACCESS_AUD: 'admin-audience' };
async function token({ audience = env.ACCESS_AUD, issuer = 'https://' + env.ACCESS_TEAM_DOMAIN, expires = '5m' } = {}) {
  return new SignJWT({ email: 'admin@example.test' }).setProtectedHeader({ alg: 'RS256' }).setSubject('user-id').setIssuer(issuer).setAudience(audience).setExpirationTime(expires).sign(privateKey);
}
function request(jwt, host = env.ADMIN_HOSTNAME) {
  return new Request(`https://${host}/admin/`, { headers: jwt ? { 'Cf-Access-Jwt-Assertion': jwt } : {} });
}

test('validates Access signature, issuer, audience, expiration and configured hostname', async () => {
  assert.deepEqual(await verifyAccess(request(await token()), env, publicKey), { email: 'admin@example.test' });
  for (const options of [{ audience: 'different-app' }, { issuer: 'https://other.cloudflareaccess.com' }, { expires: '0s' }])
    assert.equal(await verifyAccess(request(await token(options)), env, publicKey), null);
  assert.equal(await verifyAccess(request(await token(), 'other.workers.dev'), env, publicKey), null);
  const wrong = await generateKeyPair('RS256');
  assert.equal(await verifyAccess(request(await token()), env, wrong.publicKey), null);
});

test('fails closed without configuration or a valid assertion', async () => {
  assert.equal(await verifyAccess(request(), env, publicKey), null);
  assert.equal(await verifyAccess(request('forged'), env, publicKey), null);
  assert.equal(await verifyAccess(request(await token()), {}, publicKey), null);
});
