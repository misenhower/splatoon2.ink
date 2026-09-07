import { afterEach, beforeEach, test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { actions } from '../../src/web/store/splatoon/data.js';

let timers;
let commits;
const context = {
    rootGetters: { 'splatoon/languages/selectedLanguage': null },
    dispatch(name) { return actions[name](context); },
    commit(name, value) { commits.push({ name, value }); },
};

beforeEach(() => {
    timers = new Map;
    commits = [];
    let id = 0;
    mock.method(globalThis, 'setTimeout', (callback, ms) => { timers.set(++id, { callback, ms }); return id; });
    mock.method(globalThis, 'clearTimeout', id => timers.delete(id));
});
afterEach(() => {
    actions.stopUpdatingData();
    mock.restoreAll();
});

test('a stalled body times out and leaves a future refresh scheduled', async () => {
    mock.method(globalThis, 'fetch', async (url, { signal }) => new Response(new ReadableStream({
        start(controller) {
            signal.addEventListener('abort', () => controller.error(new Error('aborted')), { once: true });
        },
    })));
    let refreshing = actions.startUpdatingData(context);
    assert.equal(timers.size, 5);
    for (let timer of [...timers.values()]) {
        assert.equal(timer.ms, 30_000);
        timer.callback();
    }
    await refreshing;
    assert.equal(commits.length, 0);
    assert.equal(timers.size, 1);
    assert.ok([...timers.values()][0].ms > 0);
});

test('a failed fetch retains old data and does not stop the refresh loop', async () => {
    mock.method(globalThis, 'fetch', async () => new Response('down', { status: 503 }));
    await actions.startUpdatingData(context);
    assert.equal(commits.length, 0);
    assert.equal(timers.size, 1);
    actions.stopUpdatingData();
    assert.equal(timers.size, 0);
});

test('stop and restart while an old refresh finishes creates only one timer', async () => {
    let release;
    let pending = new Promise(resolve => { release = resolve; });
    mock.method(globalThis, 'fetch', async () => { await pending; return Response.json({ current: true }); });
    let first = actions.startUpdatingData(context);
    actions.stopUpdatingData();
    let second = actions.startUpdatingData(context);
    release();
    await Promise.all([first, second]);
    assert.equal(timers.size, 1);
    await actions.startUpdatingData(context); // Already running: no extra fetch or timer
    assert.equal(timers.size, 1);
});
