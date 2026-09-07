import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextDataRefreshAt } from '../src/common/dataRefresh.js';

const at = time => Date.parse(`2026-09-07T${time}Z`);
test('a late hourly publication is picked up again without waiting another hour', () => {
    assert.equal(nextDataRefreshAt(at('10:00:10'), 0), at('10:00:25'));
    assert.equal(nextDataRefreshAt(at('10:00:40'), 0), at('10:01:25'));
    assert.equal(nextDataRefreshAt(at('10:04:40'), 0), at('10:05:25'));
    assert.equal(nextDataRefreshAt(at('10:05:40'), 0), at('10:10:25'));
    assert.equal(nextDataRefreshAt(at('10:59:59'), 34), at('11:00:59'));
});
