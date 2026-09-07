// Runs the social posters (src/app/twitter) against this Worker's R2 bindings, after the
// updaters have published the hour's data. The Worker's counterpart of postLocally().
//
// The posters read their credentials and the screenshot configuration from process.env,
// which Workers populate from the bindings: BLUESKY_*, SITE_URL,
// CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_BROWSER_RUN_API_TOKEN. With no social credentials set
// they only render and save the public images (shadow mode).

import { sendStatuses, createClients } from '../../../src/app/social/index.js';
import { bucketStorage } from './updaters.mjs';
import { createLogger } from './log.mjs';

/**
 * @param {{ ASSETS: R2Bucket, PRIVATE: R2Bucket }} env
 * @returns {Promise<{ ok: boolean, ms: number, clients: string[] }>}
 */
export async function runPosters(env) {
  let log = createLogger('posters');
  let started = Date.now();
  let clients = createClients();
  let enabled = [];
  for (let client of clients)
    if (await client.canSend())
      enabled.push(client.key);

  let result = await sendStatuses(bucketStorage(env), clients);

  let summary = { ...result, ms: Date.now() - started, clients: enabled };
  log[summary.ok ? 'info' : 'error']('Posters finished', summary);
  return summary;
}
