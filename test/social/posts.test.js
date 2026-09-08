import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import SchedulePost from '../../src/app/social/posts/SchedulePost.js';
import SalmonRunPost from '../../src/app/social/posts/SalmonRunPost.js';
import NewStagePost from '../../src/app/social/posts/NewStagePost.js';
import SplatfestPost from '../../src/app/social/posts/SplatfestPost.js';
import { createPosts } from '../../src/app/social/posts/index.js';
import { storage, nextRun, fakeClient, json, seed } from './support.js';

const NOW = 3600 * 1000; // an hour boundary, as getTopOfCurrentHour returns
const stage = (id, name) => ({ id, name, image: `/images/stage/${id}.png` });
const rotation = (start, a, b, rule) => ({ start_time: start, end_time: start + 7200, stage_a: a, stage_b: b, rule: { key: rule, name: rule } });

let s, client;
beforeEach(async () => {
  s = storage();
  client = fakeClient('bluesky');
  await seed(s.publicBucket, 'data/festivals.json', { na: { festivals: [], results: [] }, eu: { festivals: [], results: [] }, jp: { festivals: [], results: [] } });
});

function pinTime(post, time) {
  post.getDataTime = async () => time;
  post.getImage = async () => new Uint8Array([1]);
  return post;
}

test('createPosts builds every post against the same storage and clients', () => {
  const screenshots = {};
  const posts = createPosts(s, [client], screenshots);
  assert.deepEqual(posts.map(t => t.getKey()), ['schedule', 'gear', 'salmonrun', 'weapon', 'newstage', 'splatfest-na', 'splatfest-eu', 'splatfest-jp']);
  assert.ok(posts.every(t => t.publicStorage === s.publicStorage && t.clients[0] === client && t.screenshots === screenshots));
});

test('schedule: posts the rotation for the current hour, with new-stage wording when the stage is new', async () => {
  const reef = stage('0', 'The Reef'), skipper = stage('22', 'Skipper Pavilion');
  await seed(s.publicBucket, 'data/schedules.json', {
    regular: [rotation(NOW, reef, skipper, 'Turf War')], gachi: [rotation(NOW, reef, skipper, 'Splat Zones')], league: [rotation(NOW, reef, skipper, 'Rainmaker')],
  });
  await seed(s.privateBucket, 'stages.json', [{ ...reef, first_seen: -1, first_available: -1 }, { ...skipper, first_seen: NOW - 7200, first_available: NOW }]);

  const post = pinTime(new SchedulePost(s, [client]), NOW);
  await post.maybePost();
  assert.equal(client.sent[0].status, 'NEW STAGE: Skipper Pavilion is now open! #maprotation #splatoon2');
  assert.ok(await s.publicBucket.get('twitter-images/schedule.png'));

  const later = pinTime(new SchedulePost(nextRun(s), [client]), NOW + 3600);
  assert.equal(await later.maybePost(), false); // no rotation starts at that hour
});

test('schedule: the plain rotation text names the ranked and league rules', async () => {
  const reef = stage('0', 'The Reef'), fitness = stage('1', 'Musselforge Fitness');
  await seed(s.publicBucket, 'data/schedules.json', {
    regular: [rotation(NOW, reef, fitness, 'Turf War')], gachi: [rotation(NOW, reef, fitness, 'Splat Zones')], league: [rotation(NOW, reef, fitness, 'Rainmaker')],
  });
  const post = pinTime(new SchedulePost(s, [client]), NOW);
  assert.equal(await post.getText(await post.getData()), 'Splatoon 2 map rotation: Ranked game mode: Splat Zones, League game mode: Rainmaker #maprotation');
});

test('salmon run: posts when a shift opens, remembers it, and posts again when it closes', async () => {
  const shift = { start_time: NOW, end_time: NOW + 3600 * 36, stage: { name: 'Spawning Grounds' }, weapons: [{ id: '0', weapon: { name: 'Splattershot' } }] };
  await seed(s.publicBucket, 'data/coop-schedules.json', { schedules: [shift], details: [shift] });
  await seed(s.publicBucket, 'data/timeline.json', { coop: { reward_gear: { gear: { name: 'Cap' } } } });

  await pinTime(new SalmonRunPost(nextRun(s), [client]), NOW).maybePost();
  assert.equal(client.sent[0].status, 'Salmon Run is now open on Spawning Grounds! Current reward gear is the Cap. #salmonrun #splatoon2');
  assert.deepEqual(await json(s.privateBucket, 'salmonrun-previousSchedule.json'), shift);

  assert.equal(await pinTime(new SalmonRunPost(nextRun(s), [client]), NOW + 3600).maybePost(), false); // mid-shift, not a 12-hour mark

  await pinTime(new SalmonRunPost(nextRun(s), [client]), NOW + 3600 * 12).maybePost();
  assert.match(client.sent[1].status, /is still open on Spawning Grounds/);

  const next = { start_time: NOW + 3600 * 40, end_time: NOW + 3600 * 76 };
  await seed(s.publicBucket, 'data/coop-schedules.json', { schedules: [next], details: [] });
  await pinTime(new SalmonRunPost(nextRun(s), [client]), NOW + 3600 * 36).maybePost();
  assert.equal(client.sent[2].status, 'Salmon Run is now closed. The next shift starts in 4 hours! #salmonrun #splatoon2');
});

test('new stage: posts the mirrored stage image the hour the stage was first seen', async () => {
  await seed(s.privateBucket, 'stages.json', [{ id: '22', name: 'Skipper Pavilion', image: '/images/stage/22.png', first_seen: NOW, first_available: NOW + 7200 }]);
  await s.publicBucket.put('assets/splatnet/images/stage/22.png', new Uint8Array([7]));
  const post = new NewStagePost(s, [client]);
  post.getDataTime = async () => NOW;
  await post.maybePost();
  assert.equal(client.sent[0].status, 'NEW STAGE: The first schedules for Skipper Pavilion have been posted! Start playing the new stage when this post is 2 hours old. #splatoon2');
  assert.deepEqual(client.sent[0].media[0].file, new Uint8Array([7]));
});

test('splatfest: a global fest posts once, from the first region', async () => {
  const fest = { festival_id: 5, names: { alpha_short: 'A', bravo_short: 'B' }, times: { announce: 0, start: NOW, end: NOW + 3600, result: NOW + 7200 } };
  await seed(s.publicBucket, 'data/festivals.json', { na: { festivals: [fest], results: [] }, eu: { festivals: [fest], results: [] }, jp: { festivals: [fest], results: [] } });

  const sentBy = [];
  for (const region of ['na', 'eu', 'jp']) {
    const c = fakeClient('bluesky');
    await pinTime(new SplatfestPost(region, s, [c]), NOW).maybePost();
    if (c.sent.length) sentBy.push([region, c.sent[0].status]);
  }
  assert.deepEqual(sentBy, [['na', 'The global Splatfest is now open! #splatfest #splatoon2']]);
});
