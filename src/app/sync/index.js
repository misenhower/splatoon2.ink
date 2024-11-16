const S3Syncer = require('./S3Syncer');

function canSync() {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET &&
    process.env.AWS_S3_PRIVATE_BUCKET
  );
}

async function doSync(download, upload) {
  if (!canSync()) {
    console.warn('Missing S3 connection parameters');
    return;
  }

  const syncer = new S3Syncer();

  if (download) {
    console.info('Downloading files...');
    await syncer.download();
  }

  if (upload) {
    console.info('Uploading files...');
    await syncer.upload();
  }
}

function sync() {
  return doSync(true, true);
}

function syncUpload() {
  return doSync(false, true);
}

function syncDownload() {
  return doSync(true, false);
}

module.exports = { canSync, sync, syncUpload, syncDownload };
