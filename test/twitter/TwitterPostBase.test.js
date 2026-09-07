import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import TwitterPostBase from '../../src/app/twitter/tweets/TwitterPostBase.js';
import { storage, fakeClient, json, seed } from './support.js';

const IMAGE = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

class HourlyPost extends TwitterPostBase {
  constructor(s, clients, { data = { id: 1 }, time = 3600, publicImage = 'hourly.png' } = {}) {
    super(s, clients);
    this.data = data; this.time = time; this.publicImage = publicImage; this.images = 0;
  }
  getKey() { return 'hourly'; }
  getName() { return 'Hourly'; }
  async getDataTime() { return this.time; }
  async getData() { return this.data; }
  async getImage() { this.images++; return IMAGE; }
  getPublicImageFilename() { return this.publicImage; }
  async getText(data) { return `Post ${data.id}`; }
}

let s, bluesky, twitter;
beforeEach(() => { s = storage(); bluesky = fakeClient('bluesky'); twitter = fakeClient('twitter'); });

test('posts to every client, saves the public image, and records the time per client', async () => {
  const post = new HourlyPost(s, [bluesky, twitter]);
  assert.equal(await post.maybePostTweet(), undefined); // postTweet ran

  assert.deepEqual(bluesky.sent, [{ status: 'Post 1', media: [{ file: IMAGE, type: 'image/png' }] }]);
  assert.deepEqual(twitter.sent, bluesky.sent);
  assert.equal(post.images, 1);
  assert.deepEqual(new Uint8Array(await (await s.publicBucket.get('twitter-images/hourly.png')).arrayBuffer()), IMAGE);
  assert.deepEqual(await json(s.privateBucket, 'bluesky-lastPostTimes.json'), { hourly: 3600 });
  assert.deepEqual(await json(s.privateBucket, 'twitter-lastTweetTimes.json'), { hourly: 3600 });
});

test('does not post the same data time twice, and posts again when it moves on', async () => {
  await seed(s.privateBucket, 'bluesky-lastPostTimes.json', { hourly: 3600, other: 99 });
  const post = new HourlyPost(s, [bluesky]);
  assert.equal(await post.maybePostTweet(), false);
  assert.deepEqual(bluesky.sent, []);
  assert.equal(post.images, 0);

  post.time = 7200;
  await post.maybePostTweet();
  assert.equal(bluesky.sent.length, 1);
  assert.deepEqual(await json(s.privateBucket, 'bluesky-lastPostTimes.json'), { hourly: 7200, other: 99 });
});

test('a client that already posted is skipped while another still posts', async () => {
  await seed(s.privateBucket, 'bluesky-lastPostTimes.json', { hourly: 3600 });
  await new HourlyPost(s, [bluesky, twitter]).maybePostTweet();
  assert.deepEqual(bluesky.sent, []);
  assert.equal(twitter.sent.length, 1);
});

test('a failing client does not record a post time and does not block the other client', async () => {
  const broken = fakeClient('bluesky', { fail: true });
  await new HourlyPost(s, [broken, twitter]).maybePostTweet();
  assert.equal(twitter.sent.length, 1);
  assert.equal(await json(s.privateBucket, 'bluesky-lastPostTimes.json'), null);
  assert.deepEqual(await json(s.privateBucket, 'twitter-lastTweetTimes.json'), { hourly: 3600 });
});

test('with no data there is nothing to post', async () => {
  const post = new HourlyPost(s, [bluesky], { data: null });
  assert.equal(await post.maybePostTweet(), false);
  assert.equal(post.images, 0);
});

test('with no client able to send, the public image is still saved', async () => {
  const offline = fakeClient('bluesky', { canSend: false });
  await new HourlyPost(s, [offline]).maybePostTweet();
  assert.deepEqual(offline.sent, []);
  assert.ok(await s.publicBucket.get('twitter-images/hourly.png'));
});

test('with no client able to send and no public image, it gives up', async () => {
  const offline = fakeClient('bluesky', { canSend: false });
  const post = new HourlyPost(s, [offline], { publicImage: null });
  assert.equal(await post.maybePostTweet(), false);
  assert.equal(post.images, 0);
});

test('test screenshots go to public storage', async () => {
  await new HourlyPost(s, []).saveTestScreenshot();
  assert.deepEqual(new Uint8Array(await (await s.publicBucket.get('test-screenshots/hourly.png')).arrayBuffer()), IMAGE);
});
