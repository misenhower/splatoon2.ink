import { getTopOfCurrentHour } from '../../../common/time.js';
import { pngSize } from '../../../common/png.js';

export default class SocialPostBase {
    /**
     * @param {{ publicStorage: object, privateStorage: object }} storage
     *   publicStorage holds the site data this post reads and the public copy of its image;
     *   privateStorage holds the last-posted times and other state.
     * @param {object[]} clients  the social clients to post through (see ../clients/)
     */
    constructor(storage = {}, clients = []) {
        this.publicStorage = storage.publicStorage;
        this.privateStorage = storage.privateStorage;
        this.clients = clients;
    }

    async maybePost() {
        try {
            // Read once: Salmon Run's getData also remembers the current shift.
            let data = await this.getData();
            if (!data)
                return false;

            let due = [];
            for (let client of this.clients)
                if (await client.canSend() && await this.shouldPostForCurrentTime(client))
                    due.push(client);

            // Without credentials, retain the public-image-only shadow mode.
            let enabled = await this.canPost();
            if (!due.length && (enabled || !this.getPublicImageFilename()))
                return false;

            return await this.post(data, due);
        } catch (error) {
            this.error(`Could not prepare post: ${error.message}`);
            return { ok: false, error: error.message, clients: [] };
        }
    }

    async canPost() {
        for (let client of this.clients)
            if (await client.canSend())
                return true;
        return false;
    }

    async post(data, clients) {
        let results = [];
        let text = await this.getText(data);
        let time = await this.getDataTime();
        let image = await this.getMedia(data, 'image/png');
        await this.maybeSavePublicImage(data, image.file);
        let media = { 'image/png': image };

        for (let client of clients) {
            try {
                let mediaType = client.mediaType ?? 'image/png';
                media[mediaType] ??= await this.getMedia(data, mediaType);
                await client.send({ status: text, media: [media[mediaType]] });
                await this.updateLastPostTime(client, time);
                results.push({ client: client.key, ok: true });
                this.info(`Posted to ${client.name}`);
            } catch (error) {
                results.push({ client: client.key, ok: false, error: error.message });
                this.error(`Could not post to ${client.name}: ${error.message}`);
            }
        }
        return { ok: results.every(result => result.ok), clients: results };
    }

    async maybeSavePublicImage(data, image) {
        let filename = this.getPublicImageFilename();
        if (filename) {
            // Keep the established public URLs; removing X does not require breaking image links.
            await this.publicStorage.writeBytes(`twitter-images/${filename}`, image);
            this.info(`Saved public image as ${filename}`);
        }
    }

    async saveTestScreenshot() {
        try {
            let data = await this.getTestData();
            if (!data) {
                this.info('No data available');
                return;
            }

            let key = this.getTestScreenshotKey();
            let { file } = await this.getMedia(data, 'image/png');

            await this.publicStorage.writeBytes(key, file);
            this.info(`Saved screenshot as ${key}`);
        }
        catch (e) {
            this.error('Couldn\'t save screenshot');
            throw e;
        }
    }

    /**
     * Data helpers
     */

    // A public data file, e.g. readData('schedules.json')
    readData(filename) {
        return this.publicStorage.readJson(`data/${filename}`);
    }

    // Private state, e.g. readState('stages.json')
    readState(filename) {
        return this.privateStorage.readJson(filename);
    }

    writeState(filename, data) {
        return this.privateStorage.writeJson(filename, data);
    }

    /**
     * Post time helpers
     */

    getLastPostTimesKey(client) {
        return `${client.key}-lastPostTimes.json`;
    }

    async getLastPostTimes(client) {
        return await this.readState(this.getLastPostTimesKey(client)) ?? {};
    }

    async getLastPostTime(client) {
        let key = this.getKey();
        return (await this.getLastPostTimes(client))[key] || 0;
    }

    async updateLastPostTime(client, time) {
        let key = this.getKey();
        let lastPostTimes = await this.getLastPostTimes(client);

        lastPostTimes[key] = time;

        await this.writeState(this.getLastPostTimesKey(client), lastPostTimes);
    }

    async shouldPostForCurrentTime(client) {
        // Check whether the current data time has already been posted
        let time = await this.getDataTime();
        let lastPostTime = await this.getLastPostTime(client);
        return lastPostTime < time;
    }

    /**
     * Log helpers
     */

    formatLogMessage(message) {
        let name = this.getName();
        return `[Social] [${name}] ${message}`;
    }

    log(message) {
        console.log(this.formatLogMessage(message));
    }

    info(message) {
        console.info(this.formatLogMessage(message));
    }

    error(message) {
        console.error(this.formatLogMessage(message));
    }

    /**
     * Overridable methods
     */

    // The unique key for this Post (used for storing the last time this Post was posted)
    getKey() { }

    // The friendly name for this Post (used for console log messages)
    getName() { }

    // The time which the current Post is based off of (usually the top of the current hour)
    async getDataTime() {
        return getTopOfCurrentHour();
    }

    // The current data item the Post is based on (used by getImage and getText)
    async getData() { }

    // Data for test screenshots
    async getTestData() {
        return this.getData();
    }

    // The image to post with the Post, as a screenshot result ({ image, type, width, height })
    // or raw PNG bytes. `format` is 'png' or 'jpeg'.
    async getImage(data, format) { }

    // The image as a media attachment: { file, type, width?, height? }
    async getMedia(data, mediaType) {
        let format = mediaType === 'image/jpeg' ? 'jpeg' : 'png';
        let result = await this.getImage(data, format);

        if (result instanceof Uint8Array) {
            let size = pngSize(result) ?? {};
            return { file: result, type: 'image/png', ...size };
        }

        return { file: result.image, type: result.type, width: result.width, height: result.height };
    }

    // The filename to store the image as (optional)
    getPublicImageFilename() { }

    // The text body of the Post
    async getText(data) { }

    // The key for test screenshots in public storage
    getTestScreenshotKey() {
        let key = this.getKey();
        return `test-screenshots/${key}.png`;
    }

    getMaxPostLength() {
        return 280;
    }
}
