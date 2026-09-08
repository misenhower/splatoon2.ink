import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../workers/screenshots/index.mjs';

test('capture-only Worker returns PNG bytes using the shared renderer', async () => {
  let image = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
  let url = 'https://example.test/screenshots.html#/schedules/3600';
  let request = new Request(`http://localhost/?${new URLSearchParams({ url })}`);
  let env = {
    BROWSER: {
      async quickAction(action, options) {
        assert.equal(action, 'screenshot');
        assert.equal(options.url, url);
        assert.equal(options.waitForSelector.selector, '[data-screenshot-ready="true"]');

        return new Response(image);
      },
    },
  };

  let response = await worker.fetch(request, env);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/png');
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), image);
});

test('capture-only Worker rejects missing and invalid targets before using the browser', async () => {
  for (let url of ['', '?url=invalid', '?url=file:///tmp/page.html']) {
    let response = await worker.fetch(new Request(`http://localhost/${url}`), {});

    assert.equal(response.status, 400);
  }
});
