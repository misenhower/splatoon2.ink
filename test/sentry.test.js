import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as SentryNode from '@sentry/node';
import { captureException } from '@sentry/core';

// Shared code (the updaters) reports through @sentry/core so it runs unchanged under
// @sentry/node and @sentry/cloudflare. That only works while both resolve to one copy of
// core: Sentry keys its global carrier by version, so a version split silently drops events.
test('captureException from @sentry/core reaches the client @sentry/node initialized', async () => {
  const seen = [];
  SentryNode.init({
    dsn: 'https://public@example.ingest.sentry.io/1',
    beforeSend: event => { seen.push(event.exception.values[0].value); return null; },
  });

  captureException(new Error('routed through core'));
  await SentryNode.flush(1000);

  assert.deepEqual(seen, ['routed through core']);
});
