const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const jsonpath = require('jsonpath');
const _ = require('lodash');
const { readJson, writeJson } = require('./utilities');

const localizationsPath = path.resolve('public/data/lang');

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

    getExpression(id, valueKey) {
        return [this.ruleset.name, id, valueKey];
    }

    readValue(id, valueKey) {
        return _.get(this.data, this.getExpression(id, valueKey));
    }

    writeValue(id, valueKey, newValue) {
        return _.setWith(this.data, this.getExpression(id, valueKey), newValue, Object);
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
            let id = _.get(entity, this.ruleset.id);
            let value = _.get(entity, valueKey);

            this.writeValue(id, valueKey, value);
        }

        this.writeData();
    }

    hasLocalizations(data) {
        let result = this.eachEntity(data, entity => this.hasLocalizationsForEntity(entity));
        return (result !== false);
    }

    hasLocalizationsForEntity(entity) {
        for (let valueKey of this.valueExpressions) {
            let id = _.get(entity, this.ruleset.id);

            if (this.readValue(id, valueKey) === undefined)
                return false;
        }

        return true;
    }
}

module.exports = LocalizationProcessor;
