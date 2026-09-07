import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import SocialPostBase from '../../src/app/social/posts/SocialPostBase.js';
import { storage, fakeClient, json, seed } from './support.js';

const IMAGE = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

class HourlyPost extends SocialPostBase {
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

let s, bluesky, other;
beforeEach(() => { s = storage(); bluesky = fakeClient('bluesky'); other = fakeClient('other'); });

test('posts to every client, saves the public image, and records the time per client', async () => {
  const post = new HourlyPost(s, [bluesky, other]);
  assert.equal((await post.maybePost()).ok, true);

  assert.deepEqual(bluesky.sent, [{ status: 'Post 1', media: [{ file: IMAGE, type: 'image/png' }] }]);
  assert.deepEqual(other.sent, bluesky.sent);
  assert.equal(post.images, 1);
  assert.deepEqual(new Uint8Array(await (await s.publicBucket.get('twitter-images/hourly.png')).arrayBuffer()), IMAGE);
  assert.deepEqual(await json(s.privateBucket, 'bluesky-lastPostTimes.json'), { hourly: 3600 });
  assert.deepEqual(await json(s.privateBucket, 'other-lastPostTimes.json'), { hourly: 3600 });
});

test('does not post the same data time twice, and posts again when it moves on', async () => {
  await seed(s.privateBucket, 'bluesky-lastPostTimes.json', { hourly: 3600, other: 99 });
  const post = new HourlyPost(s, [bluesky]);
  assert.equal(await post.maybePost(), false);
  assert.deepEqual(bluesky.sent, []);
  assert.equal(post.images, 0);

  post.time = 7200;
  await post.maybePost();
  assert.equal(bluesky.sent.length, 1);
  assert.deepEqual(await json(s.privateBucket, 'bluesky-lastPostTimes.json'), { hourly: 7200, other: 99 });
});

test('a client that already posted is skipped while another still posts', async () => {
  await seed(s.privateBucket, 'bluesky-lastPostTimes.json', { hourly: 3600 });
  await new HourlyPost(s, [bluesky, other]).maybePost();
  assert.deepEqual(bluesky.sent, []);
  assert.equal(other.sent.length, 1);
});

test('a failing client does not record a post time and does not block the other client', async () => {
  const broken = fakeClient('bluesky', { fail: true });
  const result = await new HourlyPost(s, [broken, other]).maybePost();
  assert.equal(result.ok, false);
  assert.deepEqual(result.clients.map(c => c.ok), [false, true]);
  assert.equal(other.sent.length, 1);
  assert.equal(await json(s.privateBucket, 'bluesky-lastPostTimes.json'), null);
  assert.deepEqual(await json(s.privateBucket, 'other-lastPostTimes.json'), { hourly: 3600 });
});

test('captures one PNG and converts it once for JPEG clients, preserving dimensions', async () => {
  const png = await sharp({ create: { width: 2, height: 1, channels: 3, background: '#ff0000' } }).png().toBuffer();
  class ScreenshotPost extends HourlyPost {
    async getImage() {
      this.images++;
      return { image: png, type: 'image/png', width: 2, height: 1 };
    }
  }
  bluesky.mediaType = 'image/jpeg';
  const secondJpeg = fakeClient('second'); secondJpeg.mediaType = 'image/jpeg';
  const post = new ScreenshotPost(s, [bluesky, other, secondJpeg]);
  assert.equal((await post.maybePost()).ok, true);
  assert.equal(post.images, 1);
  const jpeg = bluesky.sent[0].media[0];
  assert.equal(jpeg.type, 'image/jpeg');
  assert.equal(jpeg.width, 2);
  assert.equal(jpeg.height, 1);
  const decoded = await sharp(jpeg.file).metadata();
  assert.equal(decoded.format, 'jpeg');
  assert.equal(decoded.width, 2);
  assert.equal(decoded.height, 1);
  assert.equal(secondJpeg.sent[0].media[0], jpeg);
  assert.deepEqual(other.sent[0].media[0].file, png);
  assert.deepEqual(new Uint8Array(await (await s.publicBucket.get('twitter-images/hourly.png')).arrayBuffer()), new Uint8Array(png));
});

test('conversion failure preserves the PNG and does not checkpoint or send the JPEG post', async () => {
  bluesky.mediaType = 'image/jpeg';
  const post = new HourlyPost(s, [bluesky, other]);
  post.convertMedia = async () => { throw new Error('Images quota exceeded'); };
  const result = await post.maybePost();
  assert.equal(result.ok, false);
  assert.match(result.clients[0].error, /Images quota exceeded/);
  assert.equal(bluesky.sent.length, 0);
  assert.equal(other.sent.length, 1);
  assert.equal(post.images, 1);
  assert.ok(await s.publicBucket.get('twitter-images/hourly.png'));
  assert.equal(await json(s.privateBucket, 'bluesky-lastPostTimes.json'), null);
});

test('with no data there is nothing to post', async () => {
  const post = new HourlyPost(s, [bluesky], { data: null });
  assert.equal(await post.maybePost(), false);
  assert.equal(post.images, 0);
});

test('with no client able to send, the public image is still saved', async () => {
  const offline = fakeClient('bluesky', { canSend: false });
  await new HourlyPost(s, [offline]).maybePost();
  assert.deepEqual(offline.sent, []);
  assert.ok(await s.publicBucket.get('twitter-images/hourly.png'));
});

test('with no client able to send and no public image, it gives up', async () => {
  const offline = fakeClient('bluesky', { canSend: false });
  const post = new HourlyPost(s, [offline], { publicImage: null });
  assert.equal(await post.maybePost(), false);
  assert.equal(post.images, 0);
});

test('test screenshots go to public storage', async () => {
  await new HourlyPost(s, []).saveTestScreenshot();
  assert.deepEqual(new Uint8Array(await (await s.publicBucket.get('test-screenshots/hourly.png')).arrayBuffer()), IMAGE);
});

test('screenshot failure is reported and does not advance post state', async () => {
  const post = new HourlyPost(s, [bluesky]);
  post.getImage = async () => { throw new Error('render failed'); };
  const result = await post.maybePost();
  assert.equal(result.ok, false);
  assert.match(result.error, /render failed/);
  assert.equal(await json(s.privateBucket, 'bluesky-lastPostTimes.json'), null);
});

test('retry only sends the previously failed client, using a fresh storage view', async () => {
  const broken = fakeClient('other', { fail: true });
  const first = await new HourlyPost(s, [bluesky, broken]).maybePost();
  assert.equal(first.ok, false);
  const recovered = fakeClient('other');
  const fresh = { ...s, privateStorage: new s.privateStorage.constructor(s.privateBucket) };
  const second = await new HourlyPost(fresh, [bluesky, recovered]).maybePost();
  assert.equal(second.ok, true);
  assert.equal(bluesky.sent.length, 1);
  assert.equal(recovered.sent.length, 1);
});
