import { logMessage } from '../../log.js';
import _ from 'lodash';
import jsonpath from '../../../common/jsonpath.js';
import SplatNet from '../../../common/splatnet.js';
import { createEvents } from 'ics';
import * as Sentry from '@sentry/core'; // not @sentry/node: this file also runs in a Worker (see test/sentry.test.js)
import { languages } from '../../../common/regions.js';
import LocalizationProcessor from '../LocalizationProcessor.js';
import { DATA_CACHE_CONTROL } from '../../../common/storage/index.js';
import { cdnBackup } from '#cdn-images';

export default class Updater {
    /**
     * @param {object} options
     * @param {{ publicStorage: object, privateStorage: object }} storage
     *   publicStorage holds what the site serves (data/, assets/); privateStorage holds updater state.
     */
    constructor(options = {}, storage = {}) {
        this.options = options;
        this.publicStorage = storage.publicStorage;
        this.privateStorage = storage.privateStorage;
    }

    async update() {
        this.info('Updating data...');

        // Use the first language as the default
        let languageInfo = this.getLanguages()[0];

        // Retrieve the data
        let data = await this.handleRequest(this.getData(languageInfo));

        // Filter the root keys if necessary
        data = this.filterRootKeys(data);

        // Update localizations
        data = await this.updateLocalizations(data, languageInfo);

        // Apply any other processing
        data = await this.processData(data);

        // Write the data
        await this.publicStorage.writeJson(this.getKey(), data, { cacheControl: DATA_CACHE_CONTROL });

        // Update calendar events
        await this.updateCalendarEvents(data);

        // Download images if necessary
        await this.downloadImages(data);

        this.info('Done.');
    }

    /** Key of this updater's output in the public storage */
    getKey() {
        return `data/${this.options.filename}`;
    }

    getCalendarKey() {
        if (this.options.calendarFilename)
            return `data/${this.options.calendarFilename}`;
    }

    getData({ region, language }) {
        let splatnet = new SplatNet(region, language);

        return this.options.request(splatnet);
    }

    processData(data) {
        return data;
    }

    async handleRequest(request) {
        try {
            return await request;
        } catch (e) {
            // Send the error to Sentry
            Sentry.captureException(e);

            // Log the message to the console
            this.error(`Couldn't handle request: ${e.toString()}`);

            // Re-throw
            throw e;
        }
    }

    filterRootKeys(data) {
        if (this.options.rootKeys) {
            let result = {};

            for (let key of this.options.rootKeys) {
                let value = data[key];

                result[key] = this.shouldIncludeRootValue(value) ? value : null;
            }

            return result;
        }

        return data;
    }

    getLanguages() {
        // Only return one entry per language
        // (i.e., only return "region: NA language: en" and not "region: EU language: en")
        return _.uniqBy(languages, 'language');
    }

    getProcessors(languageInfo) {
        return this.options.localization.map(
            ruleset => new LocalizationProcessor(ruleset, languageInfo, this.publicStorage),
        );
    }

    async updateLocalizations(data, initialLanguageInfo) {
        if (this.options.localization) {
            // Update localization data for the initial language
            for (let processor of this.getProcessors(initialLanguageInfo))
                await processor.updateLocalizations(data);

            // Do we need to retrieve data for any other languages?
            let missingLanguages = [];

            for (let languageInfo of this.getLanguages()) {
                for (let processor of this.getProcessors(languageInfo)) {
                    if (!(await processor.hasLocalizations(data))) {
                        missingLanguages.push(languageInfo);
                        break;
                    }
                }
            }

            // Retrieve data for missing languages
            for (let missingLanguageInfo of missingLanguages) {
                this.info(
                    `Retrieving localized data for region: ${missingLanguageInfo.region}, language: ${missingLanguageInfo.language}`,
                );

                let localData = await this.handleRequest(this.getData(missingLanguageInfo));
                localData = this.filterRootKeys(localData);

                for (let processor of this.getProcessors(missingLanguageInfo))
                    await processor.updateLocalizations(localData);
            }
        }

        return data;
    }

    shouldIncludeRootValue(value) {
        if (!value)
            return false;

        // Remove timeline items with an importance of -1
        if ('importance' in value)
            return value.importance > -1;

        return true;
    }

    async downloadImages(data) {
        if (this.options.imagePaths) {
            for (let expression of this.options.imagePaths) {
                let splatnetImages = jsonpath.query(data, expression);

                for (let splatnetImage of splatnetImages)
                    await this.maybeDownloadImage(splatnetImage);
            }
        }
    }

    async maybeDownloadImage(imagePath) {
        if (!imagePath)
            return;

        let key = `assets/splatnet${imagePath}`;

        // Check whether the image has already been downloaded
        if (await this.publicStorage.exists(key))
            return;

        // Certain images are not available on the CDN anymore
        let backup = await cdnBackup(imagePath);

        if (backup) {
            this.info(`Using CDN backup: ${imagePath}`);
            await this.publicStorage.writeBytes(key, backup);

            return;
        }

        // Download the image
        this.info(`Downloading image: ${imagePath}`);

        let splatnet = new SplatNet();
        let image = await this.handleRequest(splatnet.getImage(imagePath));

        await this.publicStorage.writeBytes(key, image);
    }

    /**
     * Calendar output
     */

    async updateCalendarEvents(data) {
        let key = this.getCalendarKey();

        if (!key)
            return;

        let events = this.getCalendarEntries(data);
        let ical = this.getiCalData(events);

        await this.publicStorage.writeText(key, ical, { cacheControl: DATA_CACHE_CONTROL });
    }

    getCalendarTitle() {
        return this.options.name;
    }

    getCalendarEntries(data) {
        //
    }

    getiCalData(events) {
        // "events" variable should be an array of events in the following format:
        // {
        //     id: 'Some Unique ID',
        //     title: 'Some Event',
        //     description: 'Optional description',
        //     location: 'Optional location',
        //     start_time: <timestamp>,
        //     end_time: <timestamp>,
        // }

        const calendarEvents = events.map(event => ({
            uid: String(event.id),
            title: event.title,
            description: event.description,
            location: event.location,
            start: event.start_time * 1000,
            end: event.end_time * 1000,
            startInputType: 'utc',
            endInputType: 'utc',
        }));

        // Convert the calendar to an ICS string
        const { error, value } = createEvents(calendarEvents, {
            calName: this.getCalendarTitle(),
            productId: 'splatoon2.ink',
        });

        if (error)
            throw error;

        return value;
    }

    /**
     * Log helpers
     */

    formatLogMessage(message) {
        return `[Updater] [${this.options.name}] ${message}`;
    }

    log(message) {
        logMessage('log', this.formatLogMessage(message));
    }

    info(message) {
        logMessage('info', this.formatLogMessage(message));
    }

    error(message) {
        logMessage('error', this.formatLogMessage(message));
    }
}
