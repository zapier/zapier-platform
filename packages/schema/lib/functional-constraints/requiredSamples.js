'use strict';

const _ = require('lodash');
const jsonschema = require('jsonschema');

// todo: deal with circular dep.
const RESOURCE_ID = '/ResourceSchema';
const RESOURCE_METHODS = ['get', 'hook', 'list', 'search', 'create'];

const check = (definition) => {
  if (!definition.operation || _.get(definition, 'display.hidden')) {
    return null;
  }

  const samples = _.get(definition, 'operation.sample', {});
  return !_.isEmpty(samples)
    ? null
    : new jsonschema.ValidationError(
        'requires "sample", because it\'s not hidden',
        definition,
        definition.id
      );
};

module.exports = (definition, mainSchema) => {
  let definitions = [];

  if (mainSchema.id === RESOURCE_ID) {
    definitions = RESOURCE_METHODS.map((method) => definition[method]).filter(
      Boolean
    );

    // allow method definitions to inherit the sample
    if (definition.sample) {
      definitions.forEach((methodDefinition) => {
        if (methodDefinition.operation && !methodDefinition.operation.sample) {
          methodDefinition.operation.sample = definition.sample;
        }
      });
    }

    if (!definitions.length) {
      return [
        new jsonschema.ValidationError(
          'expected at least one resource operation',
          definition,
          definition.id
        ),
      ];
    }
  } else {
    definitions = [definition];
  }

  return definitions.map(check).filter(Boolean);
};
