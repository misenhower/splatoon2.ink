import { createRemoteJWKSet, jwtVerify } from 'jose';

let keySets = new Map();

export async function verifyAccess(request, env, resolveKey) {
  let domain = env.ACCESS_TEAM_DOMAIN;
  if (!domain || !env.ACCESS_AUD || new URL(request.url).hostname !== env.ADMIN_HOSTNAME)
    return null;
  let token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return null;
  try {
    let issuer = new URL(`https://${domain}`);
    if (issuer.hostname !== domain || !domain.endsWith('.cloudflareaccess.com')) return null;
    if (!resolveKey) {
      if (!keySets.has(domain))
        keySets.set(
          domain,
          createRemoteJWKSet(new URL('/cdn-cgi/access/certs', issuer), { timeoutDuration: 5000 }),
        );
      resolveKey = keySets.get(domain);
    }
    let { payload } = await jwtVerify(token, resolveKey, {
      issuer: issuer.origin,
      audience: env.ACCESS_AUD,
      algorithms: ['RS256'],
      requiredClaims: ['exp', 'sub'],
    });
    return { email: payload.email ?? 'Authenticated administrator' };
  } catch {
    return null;
  }
}
