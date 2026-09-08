import { afterEach, beforeEach, test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { actions } from '../../src/web/store/splatoon/data.js';

let timers;
let commits;
let page;
let originalDocument;
const context = {
    rootGetters: { 'splatoon/languages/selectedLanguage': null },
    dispatch(name) {
        return actions[name](context);
    },
    commit(name, value) {
        commits.push({ name, value });
    },
};

beforeEach(() => {
    originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
    page = new EventTarget();
    page.visibilityState = 'visible';
    Object.defineProperty(globalThis, 'document', { configurable: true, value: page });
    timers = new Map();
    commits = [];

    let id = 0;

    mock.method(globalThis, 'setTimeout', (callback, ms) => {
        timers.set(++id, { callback, ms });

        return id;
    });
    mock.method(globalThis, 'clearTimeout', id => timers.delete(id));
});
afterEach(() => {
    actions.stopUpdatingData();
    mock.restoreAll();

    if (originalDocument)
        Object.defineProperty(globalThis, 'document', originalDocument);
    else
        delete globalThis.document;
});

test('a stalled body times out and leaves a future refresh scheduled', async () => {
    mock.method(
        globalThis,
        'fetch',
        async (url, { signal }) =>
            new Response(
                new ReadableStream({
                    start(controller) {
                        signal.addEventListener('abort', () => controller.error(new Error('aborted')), {
                            once: true,
                        });
                    },
                }),
            ),
    );

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
    let pending = new Promise(resolve => {
        release = resolve;
    });

    mock.method(globalThis, 'fetch', async () => {
        await pending;

        return Response.json({ current: true });
    });

    let first = actions.startUpdatingData(context);

    actions.stopUpdatingData();

    let second = actions.startUpdatingData(context);

    release();
    await Promise.all([first, second]);

    assert.equal(timers.size, 1);

    await actions.startUpdatingData(context); // Already running: no extra fetch or timer
    assert.equal(timers.size, 1);
});

function visibility(state) {
    page.visibilityState = state;
    page.dispatchEvent(new Event('visibilitychange'));
}

test('returning to an old tab refreshes immediately, with a cooldown and one timer', async () => {
    let now = Date.parse('2026-09-07T10:10:00Z');

    mock.method(Date, 'now', () => now);

    const fetching = mock.method(globalThis, 'fetch', async () => Response.json({ current: true }));

    await actions.startUpdatingData(context);

    assert.equal(fetching.mock.callCount(), 5);

    now += 60_000;
    visibility('hidden');
    await setImmediate();

    assert.equal(fetching.mock.callCount(), 5);

    visibility('visible');
    await setImmediate();

    assert.equal(fetching.mock.callCount(), 10);
    assert.equal(timers.size, 1);

    visibility('hidden');
    visibility('visible');
    await setImmediate();

    assert.equal(fetching.mock.callCount(), 10);

    actions.stopUpdatingData();
    now += 60_000;
    visibility('visible');
    await setImmediate();

    assert.equal(fetching.mock.callCount(), 10);
    assert.equal(timers.size, 0);
});

test('activation does not overlap an in-flight refresh or leave a timer after stopping', async () => {
    let now = Date.now();

    mock.method(Date, 'now', () => now);

    let release;
    let pending = new Promise(resolve => {
        release = resolve;
    });
    const fetching = mock.method(globalThis, 'fetch', async () => {
        await pending;

        return Response.json({ current: true });
    });
    let refreshing = actions.startUpdatingData(context);

    now += 60_000;
    visibility('visible');

    assert.equal(fetching.mock.callCount(), 5);

    actions.stopUpdatingData();
    release();
    await refreshing;

    assert.equal(timers.size, 0);
});

test('activation cooldown does not suppress the scheduled top-of-hour refresh', async () => {
    let now = Date.parse('2026-09-07T10:59:50Z');

    mock.method(Date, 'now', () => now);

    const fetching = mock.method(globalThis, 'fetch', async () => Response.json({ current: true }));

    await actions.startUpdatingData(context);

    const [id, scheduled] = [...timers.entries()][0];

    timers.delete(id); // A real timeout is removed before its callback runs.
    now += 40_000;
    await scheduled.callback();

    assert.equal(fetching.mock.callCount(), 10);
    assert.equal(timers.size, 1);
});
