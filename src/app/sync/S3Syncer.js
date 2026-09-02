const path = require('path');
const { S3Client } = require('@aws-sdk/client-s3');
const { S3SyncClient } = require('s3-sync-client');
const mime = require('mime-types');

class S3Syncer
{
  constructor({
    publicConfig = S3Syncer.publicConfigFromEnvironment(),
    privateConfig = S3Syncer.privateConfigFromEnvironment(),
    localPath = path.resolve('.'),
    publicSyncClient,
    privateSyncClient,
  } = {}) {
    this.publicConfig = publicConfig;
    this.privateConfig = privateConfig;
    this._localPath = localPath;
    this._publicSyncClient = publicSyncClient;
    this._privateSyncClient = privateSyncClient;
  }

  static publicConfigFromEnvironment() {
    return {
      endpoint: process.env.AWS_S3_ENDPOINT,
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_S3_BUCKET,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }

  static privateConfigFromEnvironment() {
    return {
      endpoint: process.env.PRIVATE_AWS_S3_ENDPOINT,
      region: process.env.PRIVATE_AWS_REGION,
      bucket: process.env.PRIVATE_AWS_S3_BUCKET,
      accessKeyId: process.env.PRIVATE_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.PRIVATE_AWS_SECRET_ACCESS_KEY,
    };
  }

  download() {
    this.log('Downloading files...');

    return Promise.all([
      this.publicSyncClient.sync(this.publicBucket, `${this.localPath}/dist`, {
        filters: this.filters,
      }),
      this.privateSyncClient.sync(this.privateBucket, `${this.localPath}/storage`),
    ]);
  }

  upload() {
    this.log('Uploading files...');

    return Promise.all([
      this.publicSyncClient.sync(`${this.localPath}/dist`, this.publicBucket, {
        filters: this.filters,
        commandInput: input => ({
          ContentType: mime.lookup(input.Key) || undefined,
          CacheControl: input.Key.startsWith('data/')
            ? 'no-cache, stale-while-revalidate=5, stale-if-error=86400'
            : undefined,
        }),
      }),
      this.privateSyncClient.sync(`${this.localPath}/storage`, this.privateBucket),
    ]);
  }

  createS3Client(config) {
    return new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  get publicS3Client() {
    return this._publicS3Client ??= this.createS3Client(this.publicConfig);
  }

  get privateS3Client() {
    return this._privateS3Client ??= this.createS3Client(this.privateConfig);
  }

  /** @returns {S3SyncClient} */
  get publicSyncClient() {
    return this._publicSyncClient ??= new S3SyncClient({ client: this.publicS3Client });
  }

  /** @returns {S3SyncClient} */
  get privateSyncClient() {
    return this._privateSyncClient ??= new S3SyncClient({ client: this.privateS3Client });
  }

  get publicBucket() {
    return `s3://${this.publicConfig.bucket}`;
  }

  get privateBucket() {
    return `s3://${this.privateConfig.bucket}`;
  }

  get localPath() {
    return this._localPath;
  }

  get filters() {
    return [
      { exclude: () => true }, // Exclude everything by default
      { include: (key) => key.startsWith('assets/splatnet/') },
      { include: (key) => key.startsWith('data/') },
      { include: (key) => key.startsWith('twitter-images/') },
    ];
  }

  log(message) {
    console.log(`[S3] ${message}`);
  }
}

module.exports = S3Syncer;
