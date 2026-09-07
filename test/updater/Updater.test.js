import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import Updater from '../../src/app/updater/updaters/Updater.js';
import { fakeSplatNet, buckets, json, keys, setSessionEnvironment } from './support.js';

setSessionEnvironment();

const NAMES = {
  en: { thing: 'Widget', other: 'Gadget' },
  ja: { thing: 'ウィジェット', other: 'ガジェット' },
};

function thingsFor(language) {
  const names = NAMES[language] ?? NAMES.en;
  return { things: [{ id: '1', name: names.thing, image: '/images/things/one.png' }, { id: '2', name: names.other, image: '/images/things/two.png' }] };
}

class ThingsUpdater extends Updater {
  constructor(buckets, options = {}) {
    super({
      name: 'Things',
      filename: 'things.json',
      calendarFilename: 'things.ics',
      request: splatnet => splatnet.getResponse('things'),
      imagePaths: ['$..image'],
      localization: [{ name: 'things', entities: '$.things[*]', id: 'id', values: 'name' }],
      ...options,
    }, buckets);
  }

  getCalendarEntries(data) {
    return data.things.map(thing => ({ id: `thing-${thing.id}`, title: thing.name, start_time: 3600, end_time: 7200 }));
  }
}

let b;
beforeEach(() => { b = buckets(); });
afterEach(() => mock.restoreAll());

test('publishes data, locale document, and calendar with the right metadata', async () => {
  const splatnet = fakeSplatNet({ '/api/things': ({ language }) => thingsFor(language) });
  await new ThingsUpdater(b).update();

  assert.deepEqual(await json(b.publicBucket, 'data/things.json'), thingsFor('en'));
  assert.deepEqual((await b.publicBucket.head('data/things.json')).httpMetadata, {
    contentType: 'application/json',
    cacheControl: 'no-cache, stale-while-revalidate=5, stale-if-error=86400',
  });

  assert.deepEqual(await json(b.publicBucket, 'data/locale/en.json'), { things: { 1: { name: 'Widget' }, 2: { name: 'Gadget' } } });
  assert.deepEqual(await json(b.publicBucket, 'data/locale/ja.json'), { things: { 1: { name: 'ウィジェット' }, 2: { name: 'ガジェット' } } });

  const ics = await (await b.publicBucket.get('data/things.ics')).text();
  assert.match(ics, /SUMMARY:Widget/);
  assert.match(ics, /X-WR-CALNAME:Things/);
  assert.equal((await b.publicBucket.head('data/things.ics')).httpMetadata.contentType, 'text/calendar');

  assert.equal(splatnet.api[0].language, 'en');
  assert.equal(splatnet.api[0].region, 'NA');
});

test('fetches each language with missing strings using that region\'s session, then stops needing to', async () => {
  const splatnet = fakeSplatNet({ '/api/things': ({ language }) => thingsFor(language) });
  await new ThingsUpdater(b).update();

  assert.deepEqual(splatnet.api.map(r => `${r.region}/${r.language}`), [
    'NA/en', 'EU/es', 'NA/es-MX', 'EU/fr', 'NA/fr-CA', 'EU/de', 'EU/nl', 'EU/it', 'EU/ru', 'JP/ja',
  ]);

  const second = fakeSplatNet({ '/api/things': ({ language }) => thingsFor(language) });
  const puts = mock.method(b.publicBucket, 'put');
  await new ThingsUpdater(b).update();
  assert.deepEqual(second.api.map(r => r.language), ['en']);
  assert.deepEqual(puts.mock.calls.map(c => c.arguments[0]).filter(k => k.startsWith('data/locale/')), []);
});

test('mirrors only images that are missing, using one list per directory', async () => {
  await b.publicBucket.put('assets/splatnet/images/things/one.png', 'existing');
  const splatnet = fakeSplatNet({ '/api/things': ({ language }) => thingsFor(language) });
  const list = mock.method(b.publicBucket, 'list');
  const head = mock.method(b.publicBucket, 'head');
  await new ThingsUpdater(b).update();

  assert.deepEqual(splatnet.images.map(r => r.path), ['/images/things/two.png']);
  assert.equal(splatnet.images[0].cookie, null);
  assert.equal(await (await b.publicBucket.get('assets/splatnet/images/things/one.png')).text(), 'existing');
  assert.deepEqual(list.mock.calls.map(c => c.arguments[0].prefix), ['assets/splatnet/images/things/']);
  assert.equal(head.mock.calls.length, 0);
  assert.equal((await b.publicBucket.get('assets/splatnet/images/things/two.png')).httpMetadata.contentType, 'image/png');
});

test('uses the embedded backup for the image SplatNet no longer serves', async () => {
  const { cdnBackup } = await import('#cdn-images');
  const missing = '/images/skill/53c62995f9d2dc4a60f3850c5dbdd2323f1eef87.png';
  const splatnet = fakeSplatNet({ '/api/things': () => ({ things: [{ id: '1', name: 'Widget', image: missing }] }) });
  await new ThingsUpdater(b).update();

  assert.deepEqual(splatnet.images, []);
  const written = new Uint8Array(await (await b.publicBucket.get(`assets/splatnet${missing}`)).arrayBuffer());
  assert.deepEqual(written, await cdnBackup(missing));
  assert.deepEqual(written.slice(0, 4), new Uint8Array([0x89, 0x50, 0x4e, 0x47])); // a real PNG
  assert.equal(written.byteLength, 8440);
});

test('filters root keys, dropping hidden timeline items', async () => {
  fakeSplatNet({ '/api/things': () => ({ keep: { importance: 1, x: 1 }, hidden: { importance: -1 }, extra: 'dropped' }) });
  await new ThingsUpdater(b, { rootKeys: ['keep', 'hidden', 'absent'], localization: undefined, imagePaths: undefined, calendarFilename: undefined }).update();
  assert.deepEqual(await json(b.publicBucket, 'data/things.json'), { keep: { importance: 1, x: 1 }, hidden: null, absent: null });
});

test('fails the run and writes nothing when SplatNet rejects the session', async () => {
  fakeSplatNet({ '/api/things': () => new Response('forbidden', { status: 403 }) });
  await assert.rejects(new ThingsUpdater(b).update(), /status 403/);
  assert.deepEqual(keys(b.publicBucket), []);
});

test('leaves the existing locale document untouched when the update fails', async () => {
  await b.publicBucket.put('data/locale/en.json', JSON.stringify({ things: { 9: { name: 'Old' } } }));
  fakeSplatNet({ '/api/things': () => new Response('down', { status: 503 }) });
  await assert.rejects(new ThingsUpdater(b).update());
  assert.deepEqual(await json(b.publicBucket, 'data/locale/en.json'), { things: { 9: { name: 'Old' } } });
});
