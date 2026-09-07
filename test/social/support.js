import { MemoryBucket, BucketStorage } from '../../src/common/storage/index.js';

export function storage() {
  const publicBucket = new MemoryBucket;
  const privateBucket = new MemoryBucket;
  return {
    publicBucket,
    privateBucket,
    publicStorage: new BucketStorage(publicBucket),
    privateStorage: new BucketStorage(privateBucket),
  };
}

/** A fresh per-run view over the same buckets, as each real run gets (the cache is per run). */
export function nextRun(s) {
  return { publicStorage: new BucketStorage(s.publicBucket), privateStorage: new BucketStorage(s.privateBucket) };
}

/** A social client that records what it is asked to send. */
export function fakeClient(key, { canSend = true, fail = false } = {}) {
  const sent = [];
  return {
    key,
    name: key[0].toUpperCase() + key.slice(1),
    sent,
    canSend: async () => canSend,
    send: async status => {
      if (fail)
        throw new Error(`${key} is down`);
      sent.push(status);
    },
  };
}

export async function json(bucket, key) {
  const object = await bucket.get(key);
  return object ? object.json() : null;
}
export const seed = (bucket, key, value) => bucket.put(key, JSON.stringify(value));
