const assert = require('node:assert/strict');
const test = require('node:test');

const S3Syncer = require('../../src/app/sync/S3Syncer');

const publicConfig = {
  endpoint: 'https://public.example.com',
  region: 'auto',
  bucket: 'public-assets',
  accessKeyId: 'public-key',
  secretAccessKey: 'public-secret',
};

const privateConfig = {
  endpoint: 'https://private.example.com',
  region: 'us-west-1',
  bucket: 'private-state',
  accessKeyId: 'private-key',
  secretAccessKey: 'private-secret',
};

test('uses independent public and private bucket configuration', () => {
  const syncer = new S3Syncer({ publicConfig, privateConfig });

  assert.equal(syncer.publicBucket, 's3://public-assets');
  assert.equal(syncer.privateBucket, 's3://private-state');
});

test('downloads public and private files through their own clients', async () => {
  const publicCalls = [];
  const privateCalls = [];
  const syncer = new S3Syncer({
    publicConfig,
    privateConfig,
    localPath: '/app',
    publicSyncClient: {
      sync: (...args) => publicCalls.push(args),
    },
    privateSyncClient: {
      sync: (...args) => privateCalls.push(args),
    },
  });

  await syncer.download();

  assert.equal(publicCalls.length, 1);
  assert.equal(publicCalls[0][0], 's3://public-assets');
  assert.equal(publicCalls[0][1], '/app/dist');
  assert.equal(publicCalls[0][2].filters.length, 4);
  assert.deepEqual(privateCalls, [[
    's3://private-state',
    '/app/storage',
  ]]);
});

test('uploads public and private files through their own clients', async () => {
  const publicCalls = [];
  const privateCalls = [];
  const syncer = new S3Syncer({
    publicConfig,
    privateConfig,
    localPath: '/app',
    publicSyncClient: {
      sync: (...args) => publicCalls.push(args),
    },
    privateSyncClient: {
      sync: (...args) => privateCalls.push(args),
    },
  });

  await syncer.upload();

  assert.equal(publicCalls.length, 1);
  assert.equal(publicCalls[0][0], '/app/dist');
  assert.equal(publicCalls[0][1], 's3://public-assets');

  const publicDataInput = publicCalls[0][2].commandInput({ Key: 'data/schedules.json' });
  assert.deepEqual(publicDataInput, {
    ContentType: 'application/json',
    CacheControl: 'no-cache, stale-while-revalidate=5, stale-if-error=86400',
  });

  assert.deepEqual(privateCalls, [[
    '/app/storage',
    's3://private-state',
  ]]);
});
