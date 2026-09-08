// Runs the shared updaters (src/app/updater) against this Worker's R2 bindings.
// This is the Worker's counterpart of src/app/node.js.

import { BucketStorage } from '../../../src/common/storage/index.js';
import { updateAll } from '../../../src/app/updater/index.js';
import { createLogger } from './log.mjs';

export function bucketStorage(env) {
  return {
    publicStorage: new BucketStorage(env.ASSETS),
    privateStorage: new BucketStorage(env.PRIVATE),
  };
}

/**
 * @param {{ ASSETS: R2Bucket, PRIVATE: R2Bucket }} env
 * @param {{ only?: string[] }} [options]  restrict to updaters with these names
 * @returns {Promise<{ ok: boolean, ms: number, updaters: object[] }>}
 */
export async function runUpdaters(env, { only } = {}) {
  let log = createLogger('updaters');
  let started = Date.now();
  let updaters = await updateAll(bucketStorage(env), { only });
  let summary = { ok: updaters.every(u => u.ok), ms: Date.now() - started, updaters };

  log[summary.ok ? 'info' : 'error']('Updaters finished', summary);

  return summary;
}
