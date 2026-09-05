import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { MemoryBucket, BucketStorage, FilesystemStorage } from '../../src/common/storage/index.js';

// One contract for the storage interface the updaters use, run against every implementation.
const implementations = {
  BucketStorage: {
    create: async () => new BucketStorage(new MemoryBucket),
    destroy: async () => {},
  },
  FilesystemStorage: {
    create: async () => new FilesystemStorage(await mkdtemp(path.join(tmpdir(), 'storage-'))),
    destroy: storage => rm(storage.root, { recursive: true, force: true }),
  },
};

for (const [name, { create, destroy }] of Object.entries(implementations)) {
  describe(name, () => {
    let storage;
    beforeEach(async () => { storage = await create(); });
    afterEach(() => destroy(storage));

    test('missing keys do not exist and read as null', async () => {
      assert.equal(await storage.exists('data/missing.json'), false);
      assert.equal(await storage.readJson('data/missing.json'), null);
      assert.equal(await storage.readBytes('assets/missing.png'), null);
    });

    test('json round-trips and becomes visible to exists', async () => {
      await storage.writeJson('data/nested/a.json', { hello: 'world' });
      assert.equal(await storage.exists('data/nested/a.json'), true);
      assert.deepEqual(await storage.readJson('data/nested/a.json'), { hello: 'world' });

      await storage.writeJson('data/nested/a.json', { hello: 'again' });
      assert.deepEqual(await storage.readJson('data/nested/a.json'), { hello: 'again' });
    });

    test('bytes and text round-trip', async () => {
      await storage.writeBytes('assets/x.png', new Uint8Array([1, 2, 3]));
      assert.deepEqual(await storage.readBytes('assets/x.png'), new Uint8Array([1, 2, 3]));
      assert.equal(await storage.exists('assets/x.png'), true);

      await storage.writeText('data/cal.ics', 'BEGIN:VCALENDAR');
      assert.equal(await storage.exists('data/cal.ics'), true);
      assert.equal(new TextDecoder().decode(await storage.readBytes('data/cal.ics')), 'BEGIN:VCALENDAR');
    });
  });
}
