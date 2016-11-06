'use strict';

const _ = require('lodash');
const dataTools = require('./data');

const quote = (s) => "'" + s + "'";
const join = (list) => list.map(quote).join(', ');

const enumeratePossibilities = (methodPath) => {
  let possibilities = [];
  const dotCount = (methodPath.match(/\./g) || []).length;
  if (dotCount === 1) {
    possibilities.push(`resources.${methodPath}.operation.perform`);
    if (_.startsWith(methodPath, 'triggers') ||
        _.startsWith(methodPath, 'searches') ||
        _.startsWith(methodPath, 'creates')) {
      possibilities.push(`${methodPath}.operation.perform`);
    }
    if (_.startsWith(methodPath, 'authentication') ||
        _.startsWith(methodPath, 'hydrators')) {
      possibilities.push(methodPath);
    }
  } else if (dotCount === 0) {
    possibilities.push(`hydrators.${methodPath}`);
    possibilities.push(`triggers.${methodPath}.operation.perform`);
    possibilities.push(`searches.${methodPath}.operation.perform`);
    possibilities.push(`creates.${methodPath}.operation.perform`);
  } else if (dotCount > 1) { // full method path?
    possibilities.push(methodPath);
  }
  return possibilities;
};

const isRequestMethod = (needleOrFunc) => {
  return typeof needleOrFunc === 'object' && typeof needleOrFunc.url === 'string';
};

/*
  Resolves shorthand app method path into full path.
  Why? Because 'resources.contact.get.operation.perform' is very long!

  Can take several argument style:

    // the full path as a string
    resolveMethodPath(app, 'resources.contact.get.operation.perform')

    // a findable function/method
    resolveMethodPath(app, app.resources.contact.get.operation.perform)

    // shorthand techniques
    resolveMethodPath(app, 'contact.get') // 'resources.contact.get.operation.perform'
    resolveMethodPath(app, 'contact_list') // 'triggers.contact_list.operation.perform'
       (checks hydrators, triggers, searches, creates, etc.)
    resolveMethodPath(app, 'getRecentComments') // 'hydrators.getRecentComments'
    resolveMethodPath(app, 'triggers.contact_list') // 'triggers.contact_list.operation.perform'

    // ?? a require path to a module (from your app's root)
    resolveMethodPath(app, './some/file')

  If there are several possible paths, we'll raise
*/
const resolveMethodPath = (app, needleOrFunc) => {
  let possibilities;

  // can be a function (directly callable), an array (like inputFields) or a path itself
  if (typeof needleOrFunc === 'function' || _.isArray(needleOrFunc) || isRequestMethod(needleOrFunc)) {
    const path = dataTools.findMapDeep(app, needleOrFunc);
    if (!path) {
      throw new Error('We could not find your function, is it registered somewhere on your app?');
    }
    possibilities = [path];
  } else if (typeof needleOrFunc === 'string') {
    possibilities = enumeratePossibilities(needleOrFunc);
  } else {
    throw new Error('You must pass in a string or a registered function/array.');
  }

  const paths = possibilities.filter(path => _.get(app, path) !== undefined);

  if (!paths.length) {
    throw new Error(`${quote(needleOrFunc)} is not a valid full path / shorthand path. We checked ${join(possibilities)}.`);
  }

  if (paths.length > 1) {
    throw new Error(`Found more than one paths with functions: ${join(paths)}. Can you be more specific?`);
  }

  return paths[0];
};

module.exports = resolveMethodPath;
