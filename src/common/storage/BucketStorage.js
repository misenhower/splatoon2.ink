// Storage over an R2 bucket binding (or MemoryBucket in tests), with a thin per-run cache.
//
// Callers keep the shape the filesystem code had (exists / readJson / writeJson) and this
// class keeps the round trips down because the bucket is remote:
//   - exists(key) lists the key's directory once and answers from memory after that;
//   - readJson(key) parses each document once and hands back the same object each time;
//   - writeJson(key) skips the put when the content matches what is already stored.
// Writes go straight through. Create one instance per update run.

import { contentTypeFor } from './index.js';

function directoryOf(key) {
    return key.slice(0, key.lastIndexOf('/') + 1);
}

export default class BucketStorage {
    #bucket;
    #listings = new Map(); // directory prefix -> Set of keys under it
    #documents = new Map(); // key -> { data, serialized } for JSON documents (data may be null)

    constructor(bucket) {
        this.#bucket = bucket;
    }

    async #listing(directory) {
        if (!this.#listings.has(directory)) {
            let keys = new Set();
            let cursor;

            do {
                let page = await this.#bucket.list({ prefix: directory, cursor, limit: 1000 });

                for (let object of page.objects)
                    keys.add(object.key);

                cursor = page.truncated ? page.cursor : undefined;
            } while (cursor);

            this.#listings.set(directory, keys);
        }

        return this.#listings.get(directory);
    }

    #noteWritten(key) {
        this.#listings.get(directoryOf(key))?.add(key);
    }

    async exists(key) {
        return (await this.#listing(directoryOf(key))).has(key);
    }

    /** The parsed document, or null if it does not exist. The same object is returned on every call. */
    async readJson(key) {
        if (!this.#documents.has(key)) {
            let object = await this.#bucket.get(key);
            let serialized = object ? await object.text() : null;

            this.#documents.set(key, {
                data: serialized === null ? null : JSON.parse(serialized),
                serialized,
            });
        }

        return this.#documents.get(key).data;
    }

    /** @returns {Promise<boolean>} whether anything was written */
    async writeJson(key, data, { cacheControl } = {}) {
        let serialized = JSON.stringify(data);

        if (this.#documents.get(key)?.serialized === serialized)
            return false;

        await this.#bucket.put(key, serialized, {
            httpMetadata: { contentType: 'application/json', cacheControl },
        });
        this.#documents.set(key, { data, serialized });
        this.#noteWritten(key);

        return true;
    }

    /** @returns {Promise<Uint8Array | null>} */
    async readBytes(key) {
        let object = await this.#bucket.get(key);

        return object ? new Uint8Array(await object.arrayBuffer()) : null;
    }

    async writeText(key, text, { contentType = contentTypeFor(key), cacheControl } = {}) {
        await this.#bucket.put(key, text, { httpMetadata: { contentType, cacheControl } });
        this.#noteWritten(key);
    }

    async writeBytes(key, bytes, { contentType = contentTypeFor(key), cacheControl } = {}) {
        await this.#bucket.put(key, bytes, { httpMetadata: { contentType, cacheControl } });
        this.#noteWritten(key);
    }
}
