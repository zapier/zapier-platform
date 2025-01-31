'use strict';

const makeSchema = require('../utils/makeSchema');
const RefResourceSchema = require('./RefResourceSchema');
const FieldChoicesSchema = require('./FieldChoicesSchema');
const FieldMetaSchema = require('./FieldMetaSchema');

module.exports = makeSchema(
  {
    description: 'Field schema specialized for output fields.',
    id: '/OutputFieldSchema',
    type: 'object',
    required: ['key'],
    properties: {
      key: {
        description:
          'A unique machine readable key for this value (IE: "fname").',
        type: 'string',
        minLength: 1,
      },
      label: {
        description:
          'A human readable label for this value (IE: "First Name").',
        type: 'string',
        minLength: 1,
      },
      type: {
        description:
          'The type of this value. Field type of `file` will accept either a file object or a string. If a URL is provided in the string, Zapier will automatically make a GET for that file. Otherwise, a .txt file will be generated.',
        type: 'string',
        // string == unicode
        // integer == int
        // number == float
        enum: [
          'string',
          'number',
          'boolean',
          'integer',
          'datetime',
          'file',
          'password',
        ],
      },
      required: {
        description: 'If this value is required or not.',
        type: 'boolean',
      },
      placeholder: {
        description: 'An example value that is not saved.',
        type: 'string',
        minLength: 1,
      },
      primary: {
        description:
          'Use this field as part of the primary key for deduplication. You can set multiple fields as "primary", provided they are unique together. If no fields are set, Zapier will default to using the `id` field. `primary` only makes sense for `outputFields`. It only works in static `outputFields`; will not work in custom/dynamic `outputFields`. For more information, see [How deduplication works in Zapier](https://platform.zapier.com/build/deduplication).',
        type: 'boolean',
      },
      dynamic: {
        description:
          'A reference to a trigger that will power a dynamic dropdown.',
        $ref: RefResourceSchema.id,
      },
      search: {
        description:
          'A reference to a search that will guide the user to add a search step to populate this field when creating a Zap.',
        $ref: RefResourceSchema.id,
      },
      list: {
        description: 'Can a user provide multiples of this field?',
        type: 'boolean',
      },
      children: {
        type: 'array',
        items: { $ref: '/OutputFieldSchema' },
        description:
          'An array of child fields that define the structure of a sub-object for this field. Usually used for line items.',
        minItems: 1,
      },
      dict: {
        description: 'Is this field a key/value output?',
        type: 'boolean',
      },
    },
    examples: [
      { key: 'abc' },
      { key: 'abc', children: [{ key: 'abc' }] },
      { key: 'abc', type: 'integer', placeholder: 'neat' },
      { key: 'abc', type: 'integer' },
    ],
    antiExamples: [
      {
        example: {},
        reason: 'Missing required key: key',
      },
      {
        example: { key: 'abc', type: 'loltype' },
        reason: 'Invalid value for key: type',
      },
      {
        example: { key: 'abc', choices: {} },
        reason: 'Invalid value for key: choices (cannot be empty)',
      },
      {
        example: { key: 'abc', choices: [] },
        reason: 'Invalid value for key: choices (cannot be empty)',
      },
      {
        example: { key: 'abc', choices: [3] },
        reason:
          'Invalid value for key: choices (if an array, must be of either string or FieldChoiceWithLabelSchema)',
      },
      {
        example: { key: 'abc', choices: [{ label: 'Red', value: '#f00' }] },
        reason:
          'Invalid value for key: choices (if an array of FieldChoiceWithLabelSchema, must provide key `sample`)',
      },
      {
        example: { key: 'abc', choices: 'mobile' },
        reason:
          'Invalid value for key: choices (must be either object or array)',
      },

      {
        example: { key: 'abc', children: ['$func$2$f$'] },
        reason:
          'Invalid value for key: children (must be array of FieldSchema)',
      },
    ],
    additionalProperties: false,
  },
  [RefResourceSchema, FieldChoicesSchema, FieldMetaSchema],
);
