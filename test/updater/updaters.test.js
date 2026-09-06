import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import SchedulesUpdater from '../../src/app/updater/updaters/SchedulesUpdater.js';
import CoopSchedulesUpdater from '../../src/app/updater/updaters/CoopSchedulesUpdater.js';
import TimelineUpdater from '../../src/app/updater/updaters/TimelineUpdater.js';
import MerchandisesUpdater from '../../src/app/updater/updaters/MerchandisesUpdater.js';
import FestivalsUpdater from '../../src/app/updater/updaters/FestivalsUpdater.js';
import OriginalGearImageUpdater from '../../src/app/updater/updaters/OriginalGearImageUpdater.js';
import { createUpdaters } from '../../src/app/updater/updateAll.js';
import { getTopOfCurrentHour } from '../../src/common/time.js';
import gearData from '../../src/common/data/gear.json' with { type: 'json' };
import skills from '../../src/common/data/skills.json' with { type: 'json' };
import { fakeSplatNet, buckets, json, keys, setSessionEnvironment } from './support.js';

setSessionEnvironment();

let b;
beforeEach(() => { b = buckets(); });
afterEach(() => mock.restoreAll());

const stage = (id, name) => ({ id, name, image: `/images/stage/${id}.png` });
const rotation = (start, a, c, rule = 'turf_war') => ({
  id: start, start_time: start, end_time: start + 7200,
  stage_a: a, stage_b: c,
  game_mode: { key: 'regular', name: 'Regular Battle' },
  rule: { key: rule, name: 'Turf War', multiline_name: 'Turf\nWar' },
});

test('createUpdaters builds every updater against the given buckets', () => {
  const updaters = createUpdaters(b);
  assert.deepEqual(updaters.map(u => u.options.name), [
    'Original Gear', 'Schedules', 'Co-op Schedules', 'Timeline', 'Festivals NA', 'Festivals EU', 'Festivals JP', 'Merchandises',
  ]);
  assert.ok(updaters.every(u => u.publicStorage === b.publicStorage && u.privateStorage === b.privateStorage));
});

test('schedules: seeds the known stages from SplatNet and records new stages once', async () => {
  const reef = stage('0', 'The Reef'), fitness = stage('1', 'Musselforge Fitness'), skipper = stage('22', 'Skipper Pavilion');
  const schedules = { regular: [rotation(7200, skipper, reef), rotation(3600, reef, fitness)], gachi: [rotation(3600, reef, fitness)], league: [rotation(3600, fitness, reef)] };
  const splatnet = fakeSplatNet({
    '/api/schedules': () => schedules,
    '/api/data/stages': () => ({ stages: [reef, fitness] }),
  });
  const summary = await new SchedulesUpdater(b).update();
  assert.equal(summary.stagesSeeded, true);
  assert.deepEqual(summary.newStages, ['Skipper Pavilion']);

  assert.deepEqual(await json(b.publicBucket, 'data/schedules.json'), schedules);
  assert.deepEqual(await json(b.privateBucket, 'stages.json'), [
    { ...reef, first_seen: -1, first_available: -1 },
    { ...fitness, first_seen: -1, first_available: -1 },
    { ...skipper, first_seen: getTopOfCurrentHour(), first_available: 7200 },
  ]);
  assert.ok(splatnet.api.some(r => r.path === '/api/data/stages'));

  const second = fakeSplatNet({ '/api/schedules': () => schedules });
  const puts = mock.method(b.privateBucket, 'put');
  await new SchedulesUpdater(b).update();
  assert.equal(second.api.filter(r => r.path === '/api/data/stages').length, 0);
  assert.equal(puts.mock.calls.length, 0);
});

test('coop: publishes the calendar with stage and weapon details', async () => {
  const coop = {
    schedules: [{ start_time: 3600, end_time: 7200 }, { start_time: 90000, end_time: 93600 }],
    details: [{ start_time: 3600, end_time: 7200, stage: { name: 'Spawning Grounds', image: '/images/coop_stage/a.png' }, weapons: [{ id: '0', weapon: { id: '0', name: 'Splattershot', image: '/images/weapon/0.png', sub: { id: '1', name: 'Bomb' }, special: { id: '2', name: 'Special' } } }, null] }],
  };
  fakeSplatNet({ '/api/coop_schedules': () => coop });
  await new CoopSchedulesUpdater(b).update();

  const ics = await (await b.publicBucket.get('data/coop-schedules.ics')).text();
  assert.match(ics, /SUMMARY:Salmon Run on Spawning Grounds/);
  assert.match(ics, /Splattershot/);
  assert.match(ics, /Random/);
  assert.match(ics, /SUMMARY:Salmon Run\r?\n/); // the shift without details keeps the plain title
  assert.deepEqual(await json(b.publicBucket, 'data/coop-schedules.json'), coop);
});

test('timeline: keeps only coop and weapon availability, dropping hidden items', async () => {
  fakeSplatNet({ '/api/timeline': () => ({ coop: { importance: -1 }, weapon_availability: { importance: 1, availabilities: [] }, stats: { ignored: true } }) });
  await new TimelineUpdater(b).update();
  assert.deepEqual(await json(b.publicBucket, 'data/timeline.json'), { coop: null, weapon_availability: { importance: 1, availabilities: [] } });
});

test('merchandises: attaches original gear from the bundled data without its brand', async () => {
  const original = gearData.head[0];
  const brand = { id: '0', name: 'Brand', image: '/images/brand/0.png', frequent_skill: { id: '0', name: 'Skill', image: '/images/skill/0.png' } };
  const skill = { id: '0', name: 'Skill', image: '/images/skill/0.png' };
  fakeSplatNet({ '/api/onlineshop/merchandises': () => ({
    merchandises: [
      { end_time: 7200, gear: { kind: 'head', id: '1', name: original.name.toUpperCase(), image: '/images/gear/1.png', brand }, skill },
      { end_time: 7200, gear: { kind: 'head', id: '2', name: 'No Such Gear', image: '/images/gear/2.png', brand }, skill },
    ],
    extra: 'dropped',
  }) });
  await new MerchandisesUpdater(b).update();

  const data = await json(b.publicBucket, 'data/merchandises.json');
  assert.deepEqual(Object.keys(data), ['merchandises']);
  assert.equal(data.merchandises[0].original_gear.name, original.name);
  assert.equal('brand' in data.merchandises[0].original_gear, false);
  assert.ok(data.merchandises[0].original_gear.skill);
  assert.equal(data.merchandises[1].original_gear, null);
});

test('festivals: merges one region into the shared file, fetches missing rankings, uses regional languages', async () => {
  await b.publicBucket.put('data/festivals.json', JSON.stringify({ eu: { festivals: [], results: [] } }));
  await b.publicBucket.put('data/festivals/na-1-rankings.json', JSON.stringify({ existing: true }));
  const festival = id => ({ festival_id: id, names: { alpha_short: 'A', bravo_short: 'B' }, times: { start: 3600, end: 7200 }, images: { alpha: '/images/festival/a.png', bravo: '/images/festival/b.png', panel: '/images/festival/p.png' }, special_stage: { id: '100', name: 'Shifty Station', image: '/images/stage/100.png' } });
  const splatnet = fakeSplatNet({
    '/api/festivals/active': () => ({ festivals: [festival(2)] }),
    '/api/festivals/pasts': () => ({ festivals: [festival(1)], results: [{ festival_id: 1 }, { festival_id: 2 }] }),
    '/api/festivals/2/rankings': () => ({ rankings: 'two' }),
  });
  const summary = await new FestivalsUpdater('NA', b).update();
  assert.equal(summary.rankingsFetched, 1);

  const data = await json(b.publicBucket, 'data/festivals.json');
  assert.deepEqual(Object.keys(data).sort(), ['eu', 'na']);
  assert.deepEqual(data.na.festivals.map(f => f.festival_id), [2, 1]);
  assert.deepEqual(await json(b.publicBucket, 'data/festivals/na-1-rankings.json'), { existing: true });
  assert.deepEqual(await json(b.publicBucket, 'data/festivals/na-2-rankings.json'), { rankings: 'two' });
  assert.deepEqual(splatnet.api.filter(r => r.path.endsWith('/rankings')).map(r => r.path), ['/api/festivals/2/rankings']);

  // Only this region's languages are localized (NA: en, es-MX, fr-CA), all with the NA session
  const localized = splatnet.api.filter(r => r.path === '/api/festivals/active');
  assert.deepEqual(localized.map(r => `${r.region}/${r.language}`), ['NA/en', 'NA/es-MX', 'NA/fr-CA']);

  const ics = await (await b.publicBucket.get('data/festivals-na.ics')).text();
  assert.match(ics, /X-WR-CALNAME:Splatfests \(NA\)/);
  assert.match(ics, /SUMMARY:NA Splatfest: A vs. B/);
});

test('original gear: mirrors skill images from the bundled skills data', async () => {
  const images = Object.values(skills).map(s => s.image).filter(Boolean);
  await b.publicBucket.put(`assets/splatnet${images[0]}`, 'existing');
  const splatnet = fakeSplatNet();
  const summary = await new OriginalGearImageUpdater(b).update();

  assert.equal(splatnet.images.length, images.length - 2); // one already present, one from the embedded backup
  assert.equal(summary.imagesDownloaded, images.length - 1); // the backup counts as downloaded
  assert.equal(keys(b.publicBucket).length, images.length);
  assert.ok(keys(b.publicBucket).every(k => k.startsWith('assets/splatnet/images/skill/')));
});
