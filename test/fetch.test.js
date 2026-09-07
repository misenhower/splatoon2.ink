import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';
import { fetchWithTimeout } from '../src/common/fetch.js';

test('aborts a stalled request at its deadline', async () => {
    mock.method(globalThis, 'fetch', (input, { signal }) => new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    }));
    try {
        await Promise.all([
            assert.rejects(fetchWithTimeout('https://example.test', {}, 5), { name: 'TimeoutError' }),
            sleep(20),
        ]);
    } finally {
        mock.restoreAll();
    }
});

test('keeps the deadline active while reading the response body', async () => {
    mock.method(globalThis, 'fetch', async (input, { signal }) => new Response(new ReadableStream({
        start(controller) {
            signal.addEventListener('abort', () => controller.error(signal.reason), { once: true });
        },
    })));
    try {
        const response = await fetchWithTimeout('https://example.test', {}, 5);
        await Promise.all([assert.rejects(response.text(), { name: 'TimeoutError' }), sleep(20)]);
    } finally {
        mock.restoreAll();
    }
});

test('preserves caller cancellation', async () => {
    let signal;
    mock.method(globalThis, 'fetch', async (input, init) => { signal = init.signal; return new Response('ok'); });
    try {
        const controller = new AbortController;
        await fetchWithTimeout('https://example.test', { signal: controller.signal });
        controller.abort();
        assert.equal(signal.aborted, true);
    } finally {
        mock.restoreAll();
    }
});
