import jsonpath from '../../common/jsonpath.js';
import _ from 'lodash';
import { DATA_CACHE_CONTROL } from '../../common/storage/index.js';

export default class LocalizationProcessor {
    /**
     * @param {object} ruleset  { name, entities, id, values }
     * @param {{ region: string, language: string }} languageInfo
     * @param {object} storage  the public storage (BucketStorage or FilesystemStorage)
     * @param {object} [summary]  the updater's run summary; written languages are recorded in it
     */
    constructor(ruleset, languageInfo, storage, summary = null) {
        this.ruleset = ruleset;
        this.languageInfo = languageInfo;
        this.storage = storage;
        this.summary = summary;

        let entities = this.ruleset.entities;
        this.entityExpressions = (Array.isArray(entities)) ? entities : [entities];

        let values = this.ruleset.values;
        this.valueExpressions = (Array.isArray(values)) ? values : [values];
    }

    getKey() {
        return `data/locale/${this.languageInfo.language}.json`;
    }

    async readData() {
        return await this.storage.readJson(this.getKey()) ?? {};
    }

    async writeData(data) {
        let written = await this.storage.writeJson(this.getKey(), data, { cacheControl: DATA_CACHE_CONTROL });
        if (written && this.summary && !this.summary.localesWritten.includes(this.languageInfo.language))
            this.summary.localesWritten.push(this.languageInfo.language);
        return written;
    }

    getExpression(ids, valueKey) {
        return [this.ruleset.name, ...ids, valueKey];
    }

    getIdValues(entity) {
        let idParts = this.ruleset.id;

        // Support multi-part IDs
        if (!Array.isArray(idParts))
            idParts = [idParts];

        // Get the ID part values
        return idParts.map(id => _.get(entity, id));
    }

    *entities(data) {
        for (let expression of this.entityExpressions)
            yield* jsonpath.query(data, expression);
    }

    async updateLocalizations(data) {
        let localizations = await this.readData();

        for (let entity of this.entities(data)) {
            let ids = this.getIdValues(entity);
            for (let valueKey of this.valueExpressions)
                _.setWith(localizations, this.getExpression(ids, valueKey), _.get(entity, valueKey), Object);
        }

        await this.writeData(localizations);
    }

    async hasLocalizations(data) {
        let localizations = await this.readData();

        for (let entity of this.entities(data)) {
            let ids = this.getIdValues(entity);
            for (let valueKey of this.valueExpressions)
                if (_.get(localizations, this.getExpression(ids, valueKey)) === undefined)
                    return false;
        }

        return true;
    }
}
