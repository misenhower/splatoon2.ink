import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { MemoryBucket, BucketStorage } from '../../src/common/storage/index.js';
import LocalizationProcessor from '../../src/app/updater/LocalizationProcessor.js';

const en = { region: 'NA', language: 'en' };
const stages = { name: 'stages', entities: ['$..stage_a', '$..stage_b'], id: 'id', values: 'name' };
const rules = { name: 'rules', entities: '$..rule', id: 'key', values: ['name', 'multiline_name'] };
const gear = { name: 'gear', entities: '$..gear', id: ['kind', 'id'], values: 'name' };

const data = {
  regular: [{ stage_a: { id: '0', name: 'The Reef' }, stage_b: { id: '22', name: 'Skipper Pavilion' }, rule: { key: 'turf_war', name: 'Turf War', multiline_name: 'Turf\nWar' } }],
};

const json = async (bucket, key) => (await bucket.get(key)).json();

test('records localized values under name/ids/value and reports what is missing', async () => {
  const bucket = new MemoryBucket;
  await bucket.put('data/locale/en.json', JSON.stringify({ stages: { 0: { name: 'The Reef' } } }));
  const storage = new BucketStorage(bucket);

  const stageProcessor = new LocalizationProcessor(stages, en, storage);
  assert.equal(await stageProcessor.hasLocalizations(data), false); // stage 22 unknown
  await stageProcessor.updateLocalizations(data);
  assert.equal(await stageProcessor.hasLocalizations(data), true);

  const ruleProcessor = new LocalizationProcessor(rules, en, storage);
  assert.equal(await ruleProcessor.hasLocalizations(data), false);
  await ruleProcessor.updateLocalizations(data);

  assert.deepEqual(await json(bucket, 'data/locale/en.json'), {
    stages: { 0: { name: 'The Reef' }, 22: { name: 'Skipper Pavilion' } },
    rules: { turf_war: { name: 'Turf War', multiline_name: 'Turf\nWar' } },
  });
  assert.equal((await bucket.head('data/locale/en.json')).httpMetadata.cacheControl, 'no-cache, stale-while-revalidate=5, stale-if-error=86400');
});

test('supports multi-part ids and creates a missing document', async () => {
  const bucket = new MemoryBucket;
  const processor = new LocalizationProcessor(gear, en, new BucketStorage(bucket));
  await processor.updateLocalizations({ merchandises: [{ gear: { kind: 'head', id: '5', name: 'Fake Hat' } }] });
  assert.deepEqual(await json(bucket, 'data/locale/en.json'), { gear: { head: { 5: { name: 'Fake Hat' } } } });
});

test('does not rewrite a document that already has every string', async () => {
  const bucket = new MemoryBucket;
  await bucket.put('data/locale/en.json', JSON.stringify({ stages: { 0: { name: 'The Reef' }, 22: { name: 'Skipper Pavilion' } } }));
  const puts = mock.method(bucket, 'put');

  await new LocalizationProcessor(stages, en, new BucketStorage(bucket)).updateLocalizations(data);
  assert.equal(puts.mock.calls.length, 0);
});
