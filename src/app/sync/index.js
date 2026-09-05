import S3Syncer from './S3Syncer.js';

export function canSync() {
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

export function sync() {
  return doSync(true, true);
}

export function syncUpload() {
  return doSync(false, true);
}

export function syncDownload() {
  return doSync(true, false);
}
