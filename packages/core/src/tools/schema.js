'use strict';

const _ = require('lodash');

const cleaner = require('./cleaner');
const dataTools = require('./data');
const schemaTools = require('./schema-tools');
const zapierSchema = require('zapier-platform-schema');

const isVisible = (action) => !_.get(action, ['display', 'hidden']);

// Take a resource with methods like list/hook and turn it into triggers, etc.
const convertResourceDos = (appRaw) => {
  const triggers = {};
  const searches = {};
  const creates = {};
  const searchOrCreates = {};

  _.each(appRaw.resources, (resource) => {
    let search, create, trigger;

    if (resource.hook && resource.hook.operation) {
      trigger = dataTools.deepCopy(resource.hook);
      trigger.key = `${resource.key}Hook`;
      trigger.noun = resource.noun;
      trigger.operation.resource = resource.key;
      trigger.operation.type = 'hook';
      triggers[trigger.key] = trigger;
    }

    if (resource.list && resource.list.operation) {
      trigger = dataTools.deepCopy(resource.list);
      trigger.key = `${resource.key}List`;
      trigger.noun = resource.noun;
      trigger.operation.resource = resource.key;
      trigger.operation.type = 'polling';
      triggers[trigger.key] = trigger;
    }

    if (resource.search && resource.search.operation) {
      search = dataTools.deepCopy(resource.search);
      search.key = `${resource.key}Search`;
      search.noun = resource.noun;
      search.operation.resource = resource.key;
      searches[search.key] = search;
    }

    if (resource.create && resource.create.operation) {
      create = dataTools.deepCopy(resource.create);
      create.key = `${resource.key}Create`;
      create.noun = resource.noun;
      create.operation.resource = resource.key;
      creates[create.key] = create;
    }

    if (search && create && isVisible(search) && isVisible(create)) {
      const searchOrCreate = {
        // key: `${resource.key}SearchOrCreate`,
        key: `${search.key}`, // For now this is a Zapier editor limitation (has to match search)
        display: {
          label: `Find or Create ${resource.noun}`,
          description: _.get(search, ['display', 'description'], ''),
        },
        search: search.key,
        create: create.key,
      };
      searchOrCreates[searchOrCreate.key] = searchOrCreate;
    }
  });

  return { triggers, searches, creates, searchOrCreates };
};

/* When a trigger/search/create (action) links to a resource, we walk up to
 * the resource and copy missing properties from resource to the action.
 */
const copyPropertiesFromResource = (type, action, appRaw) => {
  if (
    appRaw.resources &&
    action.operation &&
    appRaw.resources[action.operation.resource]
  ) {
    const copyableProperties = ['outputFields', 'sample'];
    const resource = appRaw.resources[action.operation.resource];

    if (type === 'trigger' && action.operation.type === 'hook') {
      if (_.get(resource, 'list.operation.perform')) {
        action.operation.performList =
          action.operation.performList || resource.list.operation.perform;
      }
    } else if (type === 'search' || type === 'create') {
      if (_.get(resource, 'get.operation.perform')) {
        action.operation.performGet =
          action.operation.performGet || resource.get.operation.perform;
      }
    }

    _.extend(action.operation, _.pick(resource, copyableProperties));
  }

  return action;
};

const compileApp = (appRaw) => {
  appRaw = dataTools.deepCopy(appRaw);
  appRaw = schemaTools.findSourceRequireFunctions(appRaw);
  const extras = convertResourceDos(appRaw);

  const actions = ['triggers', 'searches', 'creates', 'searchOrCreates'];
  let problemKeys = [];

  actions.forEach((a) => {
    const collisions = _.intersection(
      Object.keys(extras[a] || {}),
      Object.keys(appRaw[a] || {})
    );
    if (collisions.length) {
      problemKeys = problemKeys.concat(collisions.map((k) => `${a}.${k}`));
    }
  });

  if (problemKeys.length) {
    const message = [
      'The following key(s) conflict with those created by a resource:\n',
      problemKeys.map((k) => `* ${k}`).join('\n'),
      '\n\nRename the key(s) in the standalone object(s) to resolve',
    ].join('');

    throw new Error(message);
  }

  appRaw.triggers = _.extend({}, extras.triggers, appRaw.triggers || {});
  appRaw.searches = _.extend({}, extras.searches, appRaw.searches || {});
  appRaw.creates = _.extend({}, extras.creates, appRaw.creates || {});
  appRaw.searchOrCreates = _.extend(
    {},
    extras.searchOrCreates,
    appRaw.searchOrCreates || {}
  );

  _.each(appRaw.triggers, (trigger) => {
    appRaw.triggers[trigger.key] = copyPropertiesFromResource(
      'trigger',
      trigger,
      appRaw
    );
  });

  _.each(appRaw.searches, (search) => {
    appRaw.searches[search.key] = copyPropertiesFromResource(
      'search',
      search,
      appRaw
    );
  });

  _.each(appRaw.creates, (create) => {
    appRaw.creates[create.key] = copyPropertiesFromResource(
      'create',
      create,
      appRaw
    );
  });

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
  serializeApp,
  prepareApp,
};
