import { test } from 'node:test';
import assert from 'node:assert/strict';
import BlueskyClient from '../../src/app/social/clients/BlueskyClient.js';

function fakeAgent() {
  const calls = { uploads: [], posts: [] };
  return {
    calls,
    uploadBlob: async (bytes, options) => { calls.uploads.push({ bytes, options }); return { data: { blob: { ref: `blob-${calls.uploads.length}` } } }; },
    post: async record => { calls.posts.push(record); },
    // RichText.detectFacets resolves handles through the agent; none in our text
    resolveHandle: async () => ({ data: { did: 'did:example' } }),
  };
}

test('uploads the media as given and posts with an image embed and aspect ratio', async () => {
  const agent = fakeAgent();
  const client = new BlueskyClient({ agent });
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff]);

  await client.send({ status: 'Hello #splatoon2', media: [{ file: jpeg, type: 'image/jpeg', width: 2432, height: 1368 }] });

  assert.equal(client.mediaType, 'image/jpeg');
  assert.deepEqual(agent.calls.uploads, [{ bytes: jpeg, options: { encoding: 'image/jpeg' } }]);
  const [post] = agent.calls.posts;
  assert.equal(post.text, 'Hello #splatoon2');
  assert.ok(post.facets.some(f => f.features[0].$type === 'app.bsky.richtext.facet#tag'));
  assert.deepEqual(post.embed, { $type: 'app.bsky.embed.images', images: [{ image: { ref: 'blob-1' }, alt: '', aspectRatio: { width: 2432, height: 1368 } }] });
});

test('omits the aspect ratio when the size is unknown', async () => {
  const agent = fakeAgent();
  await new BlueskyClient({ agent }).send({ status: 'x', media: [{ file: new Uint8Array([1]), type: 'image/png' }] });
  assert.deepEqual(Object.keys(agent.calls.posts[0].embed.images[0]), ['image', 'alt']);
});

test('cannot send without credentials', async () => {
  for (const name of ['BLUESKY_SERVICE', 'BLUESKY_IDENTIFIER', 'BLUESKY_PASSWORD']) delete process.env[name];
  assert.ok(!await new BlueskyClient().canSend());
});
