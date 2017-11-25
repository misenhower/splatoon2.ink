const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const jsonpath = require('jsonpath');
const SplatNet = require('../splatnet');
const raven = require('raven');

const dataPath = path.resolve('public/data');
const splatnetAssetPath = path.resolve('public/assets/splatnet');

class Updater {
    constructor(options = {}) {
        this.options = options;
    }

    async update() {
        this.info('Updating data...');

        // Retrieve the data
        let data = await this.handleRequest(this.getData());

        // Filter the root keys if necessary
        data = this.filterRootKeys(data);

        // Apply any other processing
        data = await this.processData(data);

        // Convert the data to a JSON string
        let dataString = JSON.stringify(data);

        // Write the data to disk
        let localPath = `${dataPath}/${this.options.filename}`;
        this.writeFile(localPath, dataString);

        // Download images if necessary
        await this.downloadImages(data);

        this.info('Done.');
    }

    getData() {
        let splatnet = new SplatNet;
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
        try {
            this.info(`Downloading image: ${imagePath}`);
            let splatnet = new SplatNet;
            let image = await this.handleRequest(splatnet.getImage(imagePath));
            this.writeFile(localPath, image);

            // Temporary: Also save the file to the old path for now
            // This allows for old versions of the site to continue downloading images
            let oldPath = path.resolve('public/assets/img/splatnet') + '/' + path.basename(imagePath);
            this.writeFile(oldPath, image);
        } catch (e) { }
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
