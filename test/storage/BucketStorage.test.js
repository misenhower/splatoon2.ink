import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryBucket, BucketStorage } from '../../src/common/storage/index.js';

test('exists lists a directory once and remembers what it wrote', async () => {
  const bucket = new MemoryBucket;
  await bucket.put('assets/splatnet/images/stage/a.png', 'a');
  await bucket.put('assets/splatnet/images/weapon/w.png', 'w');
  const list = mock.method(bucket, 'list');
  const head = mock.method(bucket, 'head');
  const storage = new BucketStorage(bucket);

  assert.equal(await storage.exists('assets/splatnet/images/stage/a.png'), true);
  assert.equal(await storage.exists('assets/splatnet/images/stage/b.png'), false);
  assert.equal(await storage.exists('assets/splatnet/images/weapon/w.png'), true);
  assert.deepEqual(list.mock.calls.map(c => c.arguments[0].prefix), ['assets/splatnet/images/stage/', 'assets/splatnet/images/weapon/']);
  assert.equal(head.mock.calls.length, 0);

  await storage.writeBytes('assets/splatnet/images/stage/b.png', new Uint8Array([1]));
  assert.equal(await storage.exists('assets/splatnet/images/stage/b.png'), true);
  assert.equal(list.mock.calls.length, 2);
});

test('readJson parses once and returns the same object, null for missing keys', async () => {
  const bucket = new MemoryBucket;
  await bucket.put('data/x.json', JSON.stringify({ a: 1 }));
  const get = mock.method(bucket, 'get');
  const storage = new BucketStorage(bucket);

  const first = await storage.readJson('data/x.json');
  const second = await storage.readJson('data/x.json');
  assert.deepEqual(first, { a: 1 });
  assert.equal(first, second);
  assert.equal(await storage.readJson('data/missing.json'), null);
  assert.equal(await storage.readJson('data/missing.json'), null);
  assert.equal(get.mock.calls.length, 2);
});

test('writeJson skips unchanged content, writes changed content with metadata, and updates the cache', async () => {
  const bucket = new MemoryBucket;
  await bucket.put('data/x.json', JSON.stringify({ a: 1 }));
  const put = mock.method(bucket, 'put');
  const storage = new BucketStorage(bucket);

  const doc = await storage.readJson('data/x.json');
  assert.equal(await storage.writeJson('data/x.json', { a: 1 }), false);
  assert.equal(put.mock.calls.length, 0);

  doc.a = 2; // mutate the shared object, as the localization processor does
  assert.equal(await storage.writeJson('data/x.json', doc, { cacheControl: 'no-cache' }), true);
  assert.equal(put.mock.calls.length, 1);
  assert.deepEqual((await bucket.get('data/x.json')).httpMetadata, { contentType: 'application/json', cacheControl: 'no-cache' });
  assert.deepEqual(await (await bucket.get('data/x.json')).json(), { a: 2 });
  assert.equal(await storage.writeJson('data/x.json', { a: 2 }), false);

  assert.equal(await storage.writeJson('data/new.json', { fresh: true }), true);
  assert.equal(await storage.exists('data/new.json'), true);
  assert.deepEqual(await storage.readJson('data/new.json'), { fresh: true });
});

test('writeText and readBytes go straight through with content types by extension', async () => {
  const bucket = new MemoryBucket;
  const storage = new BucketStorage(bucket);
  await storage.writeText('data/cal.ics', 'BEGIN:VCALENDAR', { cacheControl: 'no-cache' });
  assert.deepEqual((await bucket.get('data/cal.ics')).httpMetadata, { contentType: 'text/calendar', cacheControl: 'no-cache' });
  await storage.writeBytes('assets/a.png', new Uint8Array([9, 9]));
  assert.equal((await bucket.get('assets/a.png')).httpMetadata.contentType, 'image/png');
  assert.deepEqual(await storage.readBytes('assets/a.png'), new Uint8Array([9, 9]));
  assert.equal(await storage.readBytes('assets/none.png'), null);
});
