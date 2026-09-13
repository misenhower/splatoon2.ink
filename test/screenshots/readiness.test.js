import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markScreenshotReady } from '../../src/common/screenshot.js';

function deferred() {
    let resolve;
    const promise = new Promise(done => {
        resolve = done;
    });

    return { promise, resolve };
}

test('waits for data, Vue, fonts, images and two layout frames before signaling readiness', async () => {
    const data = deferred(),
        vue = deferred(),
        fonts = deferred(),
        image = deferred();
    const steps = [];
    const document = {
        documentElement: {
            removeAttribute: () => steps.push('reset'),
            setAttribute: (name, value) => steps.push([name, value]),
        },
        fonts: { ready: fonts.promise },
        images: [
            {
                loading: 'lazy',
                decode() {
                    assert.equal(this.loading, 'eager');
                    steps.push('image');

                    return image.promise;
                },
            },
        ],
    };
    const ready = markScreenshotReady({
        document,
        loadData: () => data.promise,
        nextTick: () => {
            steps.push('vue');

            return vue.promise;
        },
        requestAnimationFrame: callback => {
            steps.push('frame');
            callback();
        },
    });

    assert.deepEqual(steps, ['reset']);

    data.resolve([{ status: 'fulfilled' }]);
    await Promise.resolve();

    assert.deepEqual(steps, ['reset', 'vue']);

    vue.resolve();
    fonts.resolve();
    await Promise.resolve();
    await Promise.resolve();

    assert.deepEqual(steps, ['reset', 'vue', 'image']);

    image.resolve();
    await ready;

    assert.deepEqual(steps.slice(-3), ['frame', 'frame', ['data-screenshot-ready', 'true']]);
});

test('failed data and superseded routes never mark a page ready', async () => {
    let marked = false;
    const document = {
        documentElement: {
            removeAttribute() {},
            setAttribute() {
                marked = true;
            },
        },
        fonts: { ready: Promise.resolve() },
        images: [],
    };
    const options = { document, nextTick: async () => {}, requestAnimationFrame: callback => callback() };

    await assert.rejects(
        markScreenshotReady({ ...options, loadData: async () => [{ status: 'rejected' }] }),
        /data failed/,
    );
    assert.equal(marked, false);

    await markScreenshotReady({ ...options, loadData: async () => [], isCurrent: () => false });

    assert.equal(marked, false);
});
