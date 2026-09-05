// Shared test helpers: a fake SplatNet behind global fetch, and buckets.
import { mock } from 'node:test';
import { MemoryBucket, BucketStorage } from '../../src/common/storage/index.js';

export const SESSIONS = { NA: 'na-session', EU: 'eu-session', JP: 'jp-session' };

export function setSessionEnvironment() {
  process.env.NINTENDO_SESSION_ID_NA = SESSIONS.NA;
  process.env.NINTENDO_SESSION_ID_EU = SESSIONS.EU;
  process.env.NINTENDO_SESSION_ID_JP = SESSIONS.JP;
}

/**
 * Install a fake SplatNet on global fetch. `routes` maps a path (e.g. "/api/schedules") to
 * a handler receiving { language, region } and returning a JSON value; any "/images/" path
 * returns a small PNG-ish payload. Every request is recorded.
 */
export function fakeSplatNet(routes = {}) {
  const requests = [];
  mock.method(globalThis, 'fetch', async (input, init = {}) => {
    const url = new URL(input);
    const headers = new Headers(init.headers);
    const cookie = headers.get('Cookie');
    const region = Object.entries(SESSIONS).find(([, id]) => cookie === `iksm_session=${id}`)?.[0] ?? null;
    const request = { path: url.pathname, language: headers.get('Accept-Language'), cookie, region };
    requests.push(request);

    if (url.pathname.startsWith('/images/'))
      return new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), { headers: { 'content-type': 'image/png' } });
    const route = routes[url.pathname];
    if (!route)
      return new Response('not found', { status: 404 });
    const result = await route(request);
    return result instanceof Response ? result : Response.json(result);
  });
  return {
    requests,
    get api() { return requests.filter(r => r.path.startsWith('/api/')); },
    get images() { return requests.filter(r => r.path.startsWith('/images/')); },
  };
}

/**
 * Fresh in-memory buckets plus BucketStorage over each. The one object serves both as the
 * updaters' storage argument and as a handle on the raw buckets for assertions.
 */
export function buckets() {
  const publicBucket = new MemoryBucket, privateBucket = new MemoryBucket;
  return { publicBucket, privateBucket, publicStorage: new BucketStorage(publicBucket), privateStorage: new BucketStorage(privateBucket) };
}

export async function json(bucket, key) {
  const object = await bucket.get(key);
  return object ? object.json() : null;
}

export const keys = bucket => [...bucket.objects.keys()].sort();
