'use strict';

const _ = require('lodash');
const cleaner = require('./cleaner');
const dataTools = require('./data');
const zapierSchema = require('zapier-platform-schema');

// Take a resource list/hook and turn it into triggers, etc.
const convertResourceDos = (appRaw) => {
  appRaw = dataTools.deepCopy(appRaw);

  let triggers = {}, searches = {}, creates = {};

  _.each(appRaw.resources, (resource) => {
    if (resource.hook && resource.hook.operation) {
      let trigger = resource.hook;
      trigger.key = `${resource.key}Hook`;
      trigger.noun = resource.noun;
      trigger.operation.resource = resource.key;
      trigger.operation.type = 'hook';
      trigger.operation.outputFields = trigger.operation.outputFields || resource.outputFields;
      triggers[trigger.key] = trigger;
    }

    if (resource.list && resource.list.operation) {
      let trigger = dataTools.deepCopy(resource.list);
      trigger.key = `${resource.key}List`;
      trigger.noun = resource.noun;
      trigger.operation.resource = resource.key;
      trigger.operation.type = 'polling';
      trigger.operation.outputFields = trigger.operation.outputFields || resource.outputFields;
      triggers[trigger.key] = trigger;
    }

    if (resource.search && resource.search.operation) {
      let search = dataTools.deepCopy(resource.search);
      search.key = `${resource.key}Search`;
      search.noun = resource.noun;
      search.operation.resource = resource.key;
      search.operation.outputFields = search.operation.outputFields || resource.outputFields;
      searches[search.key] = search;
    }

    if (resource.create && resource.create.operation) {
      let create = dataTools.deepCopy(resource.create);
      create.key = `${resource.key}Create`;
      create.noun = resource.noun;
      create.operation.resource = resource.key;
      create.operation.outputFields = create.operation.outputFields || resource.outputFields;
      creates[create.key] = create;
    }

    // TODO: search or create?
  });

  return dataTools.deepCopy({ triggers, searches, creates });
};

const compileApp = (appRaw) => {
  appRaw = dataTools.deepCopy(appRaw);
  const extras = convertResourceDos(appRaw);

  appRaw.triggers = _.extend({}, appRaw.triggers || {}, extras.triggers);
  appRaw.searches = _.extend({}, appRaw.searches || {}, extras.searches);
  appRaw.creates = _.extend({}, appRaw.creates || {}, extras.creates);
  return appRaw;
};

const serializeApp = (compiledApp) => {
  const cleanedApp = cleaner.recurseCleanFuncs(compiledApp);
  return dataTools.jsonCopy(cleanedApp);
};

const validateApp = (compiledApp) => {
  const cleanedApp = cleaner.recurseCleanFuncs(compiledApp);
  const results = zapierSchema.validateAppDefinition(cleanedApp);
  return dataTools.jsonCopy(results.errors);
};

const prepareApp = (appRaw) => {
  const compiledApp = compileApp(appRaw);
  return dataTools.deepFreeze(compiledApp);
};

module.exports = {
  compileApp,
  validateApp,
  convertResourceDos,
  serializeApp,
  prepareApp
};
