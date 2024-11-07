const S3Syncer = require('./S3Syncer');

function canSync() {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET &&
    process.env.AWS_S3_PRIVATE_BUCKET
  );
}

function sync() {
  if (!canSync()) {
    console.warn('Missing S3 connection parameters');
    return;
  }

  console.info('Syncing files...');

  const syncer = new S3Syncer();
  return syncer.sync();
}

module.exports = { canSync, sync };
