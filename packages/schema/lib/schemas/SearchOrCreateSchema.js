'use strict';

const { SKIP_KEY } = require('../constants');
const makeSchema = require('../utils/makeSchema');

const BasicDisplaySchema = require('./BasicDisplaySchema');
const FlatObjectSchema = require('./FlatObjectSchema');
const KeySchema = require('./KeySchema');

module.exports = makeSchema(
  {
    id: '/SearchOrCreateSchema',
    description:
      'Pair an existing search and a create to enable "Find or Create" functionality in your app',
    type: 'object',
    required: ['key', 'display', 'search', 'create'],
    properties: {
      key: {
        description:
          'A key to uniquely identify this search-or-create. Must match the search key.',
        $ref: KeySchema.id,
      },
      display: {
        description: 'Configures the UI for this search-or-create.',
        $ref: BasicDisplaySchema.id,
      },
      search: {
        description: 'The key of the search that powers this search-or-create',
        $ref: KeySchema.id,
      },
      create: {
        description: 'The key of the create that powers this search-or-create',
        $ref: KeySchema.id,
      },
      update: {
        description:
          'EXPERIMENTAL: The key of the update action (in `creates`) that will be used if a search succeeds.',
        $ref: KeySchema.id,
      },
      updateInputFromSearchOutput: {
        description:
          "EXPERIMENTAL: A mapping where the key represents the input field for the update action, and the value represents the field from the search action's output that should be mapped to the update action's input field.",
        $ref: FlatObjectSchema.id,
      },
      searchUniqueInputToOutputConstraint: {
        description:
          "EXPERIMENTAL: A mapping where the key represents an input field for the search action, and the value represents how that field's value will be used to filter down the search output for an exact match.",
        type: 'object',
      },
    },
    additionalProperties: false,
    examples: [
      {
        key: 'searchOrCreateWidgets',
        display: {
          label: 'Search or Create Widgets',
          description:
            'Searches for a widget matching the provided query, or creates one if it does not exist.',
          hidden: false,
        },
        search: 'searchWidgets',
        create: 'createWidget',
      },
      {
        key: 'upsertWidgets',
        display: {
          label: 'Upsert Widgets',
          description:
            'Searches for a widget matching the provided query and updates it if found, or creates one if it does not exist.',
          hidden: false,
        },
        search: 'searchWidgets',
        create: 'createWidget',
        update: 'updateExistingWidget',
        updateInputFromSearchOutput: {
          widget_id: 'id',
        },
        searchUniqueInputToOutputConstraint: {
          widget_name: 'name',
        },
      },
    ],
    antiExamples: [
      {
        example: {
          key: '01_Search_or_Create_Widgets',
          display: {
            label: 'Search or Create Widgets',
            description:
              'Searches for a widget matching the provided query, or creates one if it does not exist.',
            hidden: false,
          },
          search: 'searchWidgets',
          create: 'createWidget',
        },
        reason: 'Invalid value for key: key (must start with a letter)',
      },
      {
        example: {
          key: 'searchOrCreateWidgets',
          display: {
            label: 'Search or Create Widgets',
            description:
              'Searches for a widget matching the provided query, or creates one if it does not exist.',
            hidden: false,
          },
          search: { require: 'path/to/some/file.js' },
          create: { require: 'path/to/some/file.js' },
        },
        reason:
          'Invalid values for keys: search and create (must be a string that matches the key of a registered search or create)',
      },
      {
        [SKIP_KEY]: true, // Cannot validate field dependency between updateInputFromSearchOutput / searchUniqueInputToOutputConstraint and update
        example: {
          key: 'upsertWidgets',
          display: {
            label: 'Upsert Widgets',
            description:
              'Searches for a widget matching the provided query and updates it if found, or creates one if it does not exist.',
            hidden: false,
          },
          search: 'searchWidgets',
          create: 'createWidget',
          updateInputFromSearchOutput: {
            widget_id: 'id',
          },
          searchUniqueInputToOutputConstraint: {
            widget_name: 'name',
          },
        },
        reason:
          'If either the updateInputFromSearchOutput or searchUniqueInputToOutputConstraint keys are present, then the update key must be present as well.',
      },
    ],
  },
  [BasicDisplaySchema, KeySchema, FlatObjectSchema],
);
