const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp').sync;
const jsonpath = require('jsonpath');
const _ = require('lodash');
const { readJson, writeJson } = require('@/common/utilities');

const localizationsPath = path.resolve('dist/data/locale');

class LocalizationProcessor {
    constructor(ruleset, languageInfo) {
        this.ruleset = ruleset;
        this.languageInfo = languageInfo;

        let entities = this.ruleset.entities;
        this.entityExpressions = (Array.isArray(entities)) ? entities : [entities];

        let values = this.ruleset.values;
        this.valueExpressions = (Array.isArray(values)) ? values : [values];

        this.readData();
    }

    getFilename() {
        return `${localizationsPath}/${this.languageInfo.language}.json`;
    }

    readData() {
        if (fs.existsSync(this.getFilename()))
            this.data = readJson(this.getFilename());
        else
            this.data = {};
    }

    writeData() {
        mkdirp(path.dirname(this.getFilename()));
        writeJson(this.getFilename(), this.data);
    }

    getExpression(ids, valueKey) {
        return [this.ruleset.name, ...ids, valueKey];
    }

    readValue(ids, valueKey) {
        return _.get(this.data, this.getExpression(ids, valueKey));
    }

    writeValue(ids, valueKey, newValue) {
        return _.setWith(this.data, this.getExpression(ids, valueKey), newValue, Object);
    }

    getIdValues(entity) {
        let idParts = this.ruleset.id;

        // Support multi-part IDs
        if (!Array.isArray(idParts))
            idParts = [idParts];

        // Get the ID part values
        return idParts.map(id => _.get(entity, id));
    }

    eachEntity(data, callback) {
        for (let expression of this.entityExpressions) {
            let entities = jsonpath.query(data, expression);

            for (let entity of entities) {
                let result = callback(entity);
                if (result === false)
                    return false;
            }
        }
    }

    updateLocalizations(data) {
        this.eachEntity(data, entity => this.updateLocalizationsForEntity(entity));
    }

    updateLocalizationsForEntity(entity) {
        for (let valueKey of this.valueExpressions) {
            let ids = this.getIdValues(entity);
            let value = _.get(entity, valueKey);

            this.writeValue(ids, valueKey, value);
        }

        this.writeData();
    }

    hasLocalizations(data) {
        let result = this.eachEntity(data, entity => this.hasLocalizationsForEntity(entity));
        return (result !== false);
    }

    hasLocalizationsForEntity(entity) {
        for (let valueKey of this.valueExpressions) {
            let ids = this.getIdValues(entity);

            if (this.readValue(ids, valueKey) === undefined)
                return false;
        }

        return true;
    }
}

module.exports = LocalizationProcessor;
