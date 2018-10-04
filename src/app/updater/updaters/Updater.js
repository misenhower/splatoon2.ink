const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp').sync;
const _ = require('lodash');
const jsonpath = require('jsonpath');
const SplatNet = require('@/common/splatnet');
const iCal = require('cozy-ical');
const moment = require('moment-timezone');
const raven = require('raven');
const { languages } = require('@/common/regions');
const LocalizationProcessor = require('../LocalizationProcessor');

const dataPath = path.resolve('dist/data');
const splatnetAssetPath = path.resolve('dist/assets/splatnet');

class Updater {
    constructor(options = {}) {
        this.options = options;
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

        // Convert the data to a JSON string
        let dataString = JSON.stringify(data);

        // Write the data to disk
        this.writeFile(this.getFilename(), dataString);

        // Update calendar events
        this.updateCalendarEvents(data);

        // Download images if necessary
        await this.downloadImages(data);

        this.info('Done.');
    }

    getOutputPath() {
        return dataPath;
    }

    getFilename() {
        return `${this.getOutputPath()}/${this.options.filename}`;
    }

    getCalendarFilename() {
        if (this.options.calendarFilename)
            return `${this.getOutputPath()}/${this.options.calendarFilename}`;
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
        }
        catch (e) {
            // Send the error to Sentry
            raven.captureException(e);

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
                result[key] = (this.shouldIncludeRootValue(value)) ? value : null;
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

    forEachLanguage(callback) {
        for (let languageInfo of this.getLanguages())
            this.forEachRuleset(languageInfo, callback);
    }

    forEachRuleset(languageInfo, callback) {
        for (let ruleset of (this.options.localization)) {
            let processor = new LocalizationProcessor(ruleset, languageInfo);
            callback(processor, languageInfo);
        }
    }

    async updateLocalizations(data, initialLanguageInfo) {
        if (this.options.localization) {
            // Update localization data for the initial language
            this.forEachRuleset(initialLanguageInfo, processor => processor.updateLocalizations(data));

            // Do we need to retrieve data for any other languages?
            let missingLanguages = [];
            this.forEachLanguage((processor, languageInfo) => {
                if (missingLanguages.indexOf(languageInfo) === -1) {
                    if (!processor.hasLocalizations(data))
                        missingLanguages.push(languageInfo);
                }
            });

            // Retrieve data for missing languages
            for (let missingLanguageInfo of missingLanguages) {
                this.info(`Retrieving localized data for region: ${missingLanguageInfo.region}, language: ${missingLanguageInfo.language}`);
                let localData = await this.handleRequest(this.getData(missingLanguageInfo));
                localData = this.filterRootKeys(localData);
                this.forEachRuleset(missingLanguageInfo, processor => processor.updateLocalizations(localData));
            }
        }

        return data;
    }

    shouldIncludeRootValue(value) {
        if (!value)
            return false;

        // Remove timeline items with an importance of -1
        if (value.hasOwnProperty('importance'))
            return value.importance > -1;

        return true;
    }

    writeFile(filename, data) {
        mkdirp(path.dirname(filename));
        fs.writeFileSync(filename, data);
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

        let localPath = splatnetAssetPath + imagePath;

        // Check whether the image has already been downloaded
        if (fs.existsSync(localPath))
            return;

        // Otherwise, download the image
        this.info(`Downloading image: ${imagePath}`);
        let splatnet = new SplatNet;
        let image = await this.handleRequest(splatnet.getImage(imagePath));
        this.writeFile(localPath, image);
    }

    /**
     * Calendar output
     */

    updateCalendarEvents(data) {
        let filename = this.getCalendarFilename();
        if (!filename)
            return;

        let events = this.getCalendarEntries(data);
        let ical = this.getiCalData(events);
        this.writeFile(filename, ical);
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

        // Create a calendar object
        const calendar = new iCal.VCalendar({
            title: this.getCalendarTitle(),
            organization: 'https://splatoon2.ink'
        });

        // Set the calendar's native time zone to UTC
        calendar.add(new iCal.VTimezone({ timezone: 'Etc/UTC' }));

        // Add event entries
        for (let event of events) {
            calendar.add(new iCal.VEvent({
                uid: event.id,
                summary: event.title,
                description: event.description,
                location: event.location,
                startDate: moment.unix(event.start_time).utc(),
                endDate: moment.unix(event.end_time).utc(),
                stampDate: new Date(),
            }));
        }

        // Convert the calendar to an ICS string
        return calendar.toString();
    }

    /**
     * Log helpers
     */

    formatLogMessage(message) {
        return `[Updater] [${this.options.name}] ${message}`;
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
}

module.exports = Updater;
