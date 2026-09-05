import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryBucket } from '../../src/common/storage/index.js';

// MemoryBucket stands in for the R2 binding in tests, so its list() must paginate like R2's.
test('list filters by prefix, sorts, and paginates with cursors', async () => {
  const bucket = new MemoryBucket;
  for (const key of ['assets/images/stage/b.png', 'assets/images/stage/a.png', 'assets/images/stage/deep/c.png', 'assets/images/weapon/w.png', 'data/x.json'])
    await bucket.put(key, 'x');

  const all = await bucket.list({ prefix: 'assets/images/stage/' });
  assert.deepEqual(all.objects.map(o => o.key), ['assets/images/stage/a.png', 'assets/images/stage/b.png', 'assets/images/stage/deep/c.png']);
  assert.equal(all.truncated, false);

  const first = await bucket.list({ prefix: 'assets/', limit: 2 });
  assert.equal(first.truncated, true);
  const second = await bucket.list({ prefix: 'assets/', limit: 2, cursor: first.cursor });
  assert.deepEqual([...first.objects, ...second.objects].map(o => o.key).length, 4);
  assert.equal(second.truncated, false);
});

test('put and get round-trip strings, bytes, and streams with metadata', async () => {
  const bucket = new MemoryBucket;
  await bucket.put('a.json', '{"a":1}', { httpMetadata: { contentType: 'application/json' } });
  await bucket.put('b.png', new Uint8Array([1, 2]));
  await bucket.put('c.png', new Response(new Uint8Array([3])).body);

  assert.deepEqual(await (await bucket.get('a.json')).json(), { a: 1 });
  assert.equal((await bucket.head('a.json')).httpMetadata.contentType, 'application/json');
  assert.deepEqual(new Uint8Array(await (await bucket.get('b.png')).arrayBuffer()), new Uint8Array([1, 2]));
  assert.deepEqual(new Uint8Array(await (await bucket.get('c.png')).arrayBuffer()), new Uint8Array([3]));
  assert.equal(await bucket.get('missing'), null);
  await bucket.delete('a.json');
  assert.equal(await bucket.head('a.json'), null);
});
