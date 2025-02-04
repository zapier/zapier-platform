'use strict';

const makeSchema = require('../utils/makeSchema');
const FieldSchema = require('./FieldSchema');

module.exports = makeSchema(
  {
    description: 'Field schema specialized for output fields. ${FieldSchema.schema.description}',
    id: '/OutputFieldSchema',
    type: 'object',
    required: ['key'],
    properties: {
      ...FieldSchema.schema.properties,
      type: {
        description:
          'The type of this value. Field type of `file` will accept either a file object or a string. If a URL is provided in the string, Zapier will automatically make a GET for that file. Otherwise, a .txt file will be generated.',
        type: 'string',
        // string == unicode
        // number == float
        enum: ['string', 'number', 'boolean', 'datetime', 'file', 'password'],
      },
      primary: {
        description:
          'Use this field as part of the primary key for deduplication. You can set multiple fields as "primary", provided they are unique together. If no fields are set, Zapier will default to using the `id` field. `primary` only makes sense for `outputFields`. It only works in static `outputFields`; will not work in custom/dynamic `outputFields`. For more information, see [How deduplication works in Zapier](https://platform.zapier.com/build/deduplication).',
        type: 'boolean',
      },
      steadyState: {
        description:
          'Prevents triggering on new output until all values for fields with this property remain unchanged for 2 polls. It can be used to, e.g., not trigger on a new contact until the contact has completed typing their name. NOTE that this only applies to the `outputFields` of polling triggers.',
        type: 'boolean',
      },
    },
    examples: [
      { key: 'abc' },
      { key: 'abc', children: [{ key: 'abc' }] },
      { key: 'abc', type: 'number', label: 'neat' },
      { key: 'abc', type: 'number' },
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
  [FieldSchema],
);
