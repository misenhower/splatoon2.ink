const assert = require('node:assert/strict');
const test = require('node:test');

const { canSync } = require('../../src/app/sync');

const storageEnvironment = {
  AWS_S3_ENDPOINT: 'https://public.example.com',
  AWS_REGION: 'auto',
  AWS_S3_BUCKET: 'public-assets',
  AWS_ACCESS_KEY_ID: 'public-key',
  AWS_SECRET_ACCESS_KEY: 'public-secret',
  PRIVATE_AWS_S3_ENDPOINT: 'https://private.example.com',
  PRIVATE_AWS_REGION: 'us-west-1',
  PRIVATE_AWS_S3_BUCKET: 'private-state',
  PRIVATE_AWS_ACCESS_KEY_ID: 'private-key',
  PRIVATE_AWS_SECRET_ACCESS_KEY: 'private-secret',
};

function withStorageEnvironment(overrides, callback) {
  const originalValues = {};

  for (const name of Object.keys(storageEnvironment)) {
    originalValues[name] = process.env[name];
    const value = Object.hasOwn(overrides, name)
      ? overrides[name]
      : storageEnvironment[name];

    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }

  try {
    callback();
  } finally {
    for (const [name, value] of Object.entries(originalValues)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  }
}

test('can sync when both public and private storage are configured', () => {
  withStorageEnvironment({}, () => assert.equal(canSync(), true));
});

test('cannot sync when any public or private storage value is missing', () => {
  for (const name of Object.keys(storageEnvironment)) {
    withStorageEnvironment({ [name]: undefined }, () => {
      assert.equal(canSync(), false, `${name} should be required`);
    });
  }
});
