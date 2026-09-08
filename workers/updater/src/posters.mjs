import BrowserRunRenderer from '../../../src/app/screenshots/BrowserRunRenderer.js';
import ScreenshotGenerator from '../../../src/app/screenshots/ScreenshotGenerator.js';
import stringify from 'json-stable-stringify';
import { sendStatuses, createClients } from '../../../src/app/social/index.js';
import { fetchWithTimeout } from '../../../src/common/fetch.js';
import { bucketStorage } from './updaters.mjs';
import { createLogger } from './log.mjs';

// The renderer opens SITE_URL, not the bucket binding. Fail before rendering/posting if
// that site still serves another environment or stale data. This also makes shadow runs
// validate their own output. The public image URLs and private Bluesky keys stay unchanged.
export async function verifyPublishedData(publicStorage) {
  if (!process.env.SITE_URL)
    throw new Error('SITE_URL must point to a site serving this Worker\'s published data.');

  for (let filename of [
    'schedules.json',
    'coop-schedules.json',
    'timeline.json',
    'festivals.json',
    'merchandises.json',
    'locale/en.json',
  ]) {
    let key = `data/${filename}`;
    let expected = await publicStorage.readJson(key);

    if (!expected)
      throw new Error(`Missing published data: ${key}`);

    let response = await fetchWithTimeout(new URL(`/${key}`, process.env.SITE_URL), {
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (!response.ok || stringify(await response.json()) !== stringify(expected))
      throw new Error(`Rendering site data does not match this Worker: ${key}`);
  }
}

export async function runPosters(env) {
  let started = Date.now();
  let storage = bucketStorage(env);

  await verifyPublishedData(storage.publicStorage);

  let clients = createClients();
  let enabled = [];

  for (let client of clients)
    if (await client.canSend())
      enabled.push(client.key);

  let screenshots = new ScreenshotGenerator(
    new BrowserRunRenderer(env.BROWSER),
    process.env.SITE_URL,
  );
  let result = await sendStatuses(storage, clients, screenshots);
  let summary = { ...result, ms: Date.now() - started, clients: enabled };

  createLogger('social')[summary.ok ? 'info' : 'error']('Social run finished', summary);

  return summary;
}
