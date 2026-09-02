const S3Syncer = require('./S3Syncer');

function canSync() {
  const configurations = [
    S3Syncer.publicConfigFromEnvironment(),
    S3Syncer.privateConfigFromEnvironment(),
  ];

  return configurations.every(config => Object.values(config).every(Boolean));
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
