'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicDisplaySchema = require('./BasicDisplaySchema');
const BasicActionOperationSchema = require('./BasicActionOperationSchema');

module.exports = makeSchema(
  {
    id: '/ResourceMethodSearchSchema',
    description:
      'How will we find a specific object given filters or search terms? Will be turned into a search automatically.',
    type: 'object',
    required: ['display', 'operation'],
    properties: {
      display: {
        description: 'Define how this search method will be exposed in the UI.',
        $ref: BasicDisplaySchema.id,
      },
      operation: {
        description: 'Define how this search method will work.',
        $ref: BasicActionOperationSchema.id,
      },
    },
    additionalProperties: false,
    examples: [
      {
        display: {
          label: 'Find a Recipe',
          description: 'Search for recipe by cuisine style.',
        },
        operation: {
          perform: '$func$2$f$',
          sample: { id: 1 },
        },
      },
      {
        display: {
          label: 'Find a Recipe',
          description: 'Search for recipe by cuisine style.',
          hidden: true,
        },
        operation: {
          perform: '$func$2$f$',
        },
      },
    ],
    antiExamples: [
      {
        example: {
          key: 'recipe',
          noun: 'Recipe',
          display: {
            label: 'Find a Recipe',
            description: 'Search for recipe by cuisine style.',
          },
          operation: {
            perform: '$func$2$f$',
          },
        },
        reason:
          'Missing key from operation: sample. Note – this is valid if the resource has defined a sample.',
      },
    ],
  },
  [BasicDisplaySchema, BasicActionOperationSchema],
);
