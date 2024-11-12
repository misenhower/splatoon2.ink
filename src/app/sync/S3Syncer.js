const path = require('path');
const { S3Client } = require('@aws-sdk/client-s3');
const { S3SyncClient } = require('s3-sync-client');
const mime = require('mime-types');

class S3Syncer
{
  async sync() {
    await this.download();
    await this.upload();
  }

  download() {
    this.log('Downloading files...');

    return Promise.all([
      this.syncClient.sync(this.publicBucket, `${this.localPath}/dist`, {
        filters: this.filters,
      }),
      this.syncClient.sync(this.privateBucket, `${this.localPath}/storage`),
    ]);
  }

  upload() {
    this.log('Uploading files...');

    return Promise.all([
      this.syncClient.sync(`${this.localPath}/dist`, this.publicBucket, {
        filters: this.filters,
        commandInput: input => ({
          ACL: 'public-read',
          ContentType: mime.lookup(input.Key),
        }),
      }),
      this.syncClient.sync(`${this.localPath}/storage`, this.privateBucket),
    ]);
  }

  get s3Client() {
    return this._s3Client ??= new S3Client({
      endpoint: process.env.AWS_S3_ENDPOINT,
      region: process.env.AWS_S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  /** @returns {S3SyncClient} */
  get syncClient() {
    return this._syncClient ??= new S3SyncClient({ client: this.s3Client });
  }

  get publicBucket() {
    return `s3://${process.env.AWS_S3_BUCKET}`;
  }

  get privateBucket() {
    return `s3://${process.env.AWS_S3_PRIVATE_BUCKET}`;
  }

  get localPath() {
    return path.resolve('.');
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
