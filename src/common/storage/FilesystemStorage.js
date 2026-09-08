// Storage over a local directory. This is what npm run splatnet uses: keys map to paths
// under the root, so dist/ and storage/ end up exactly as they always have. HTTP metadata
// is accepted and ignored.

import { promises as fs } from 'node:fs';
import path from 'node:path';

export default class FilesystemStorage {
    constructor(root) {
        this.root = path.resolve(root);
    }

    pathFor(key) {
        return path.join(this.root, ...key.split('/'));
    }

    async exists(key) {
        try {
            return (await fs.stat(this.pathFor(key))).isFile();
        } catch (error) {
            if (error.code === 'ENOENT')
                return false;

            throw error;
        }
    }

    async #read(key) {
        try {
            return await fs.readFile(this.pathFor(key));
        } catch (error) {
            if (error.code === 'ENOENT' || error.code === 'EISDIR')
                return null;

            throw error;
        }
    }

    async #write(key, body) {
        let filename = this.pathFor(key);

        await fs.mkdir(path.dirname(filename), { recursive: true });
        await fs.writeFile(filename, body);
    }

    /** The parsed document, or null if it does not exist. */
    async readJson(key) {
        let buffer = await this.#read(key);

        return buffer === null ? null : JSON.parse(buffer.toString('utf8'));
    }

    /** @returns {Promise<boolean>} always true; the filesystem write is cheap enough not to dedupe */
    async writeJson(key, data) {
        await this.#write(key, JSON.stringify(data));

        return true;
    }

    /** @returns {Promise<Uint8Array | null>} */
    async readBytes(key) {
        let buffer = await this.#read(key);

        return buffer === null ? null : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    }

    async writeText(key, text) {
        await this.#write(key, text);
    }

    async writeBytes(key, bytes) {
        await this.#write(key, bytes);
    }
}
