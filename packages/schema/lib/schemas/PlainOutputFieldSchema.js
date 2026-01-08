'use strict';

const makeSchema = require('../utils/makeSchema');
const PlainFieldSchema = require('./PlainFieldSchema');

module.exports = makeSchema(
  {
    description: `Field schema specialized for output fields. ${PlainFieldSchema.schema.description}`,
    id: '/PlainOutputFieldSchema',
    type: 'object',
    required: ['key'],
    properties: {
      ...PlainFieldSchema.schema.properties,
      children: {
        type: 'array',
        items: { $ref: '/PlainOutputFieldSchema' },
        description:
          'An array of child fields that define the structure of a sub-object for this field. Usually used for line items.',
        minItems: 1,
      },
      type: {
        description:
          'The type of this value. Field type of `file` will accept either a file object or a string. If a URL is provided in the string, Zapier will automatically make a GET for that file. Otherwise, a .txt file will be generated.',
        type: 'string',
        // string == unicode
        // number == float
        enum: [
          'string',
          'number',
          'boolean',
          'datetime',
          'file',
          'password',
          'integer',
        ],
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
      sample: {
        description:
          'An example value for this field. Can be any type (string, number, boolean, object, array, null) to match the expected field output. Values provided here will be combined with values in the operation level `sample` field, with this field taking precedence. This is most useful when using a function to generate dynamic `outputFields`.',
        oneOf: [
          { type: 'string' },
          { type: 'number' },
          { type: 'boolean' },
          { type: 'object' },
          { type: 'array' },
          { type: 'null' },
        ],
      },
    },
    examples: [
      { key: 'abc' },
      { key: 'abc', children: [{ key: 'abc' }] },
      { key: 'abc', type: 'number', label: 'neat' },
      { key: 'abc', type: 'number' },
      { key: 'name', type: 'string', sample: 'John Doe' },
      { key: 'price', type: 'number', sample: 29.99 },
      { key: 'is_active', type: 'boolean', sample: true },
      { key: 'tags', list: true, sample: ['work', 'urgent'] },
      {
        key: 'metadata',
        sample: { created_at: '2025-01-15', author: 'system' },
      },
      {
        key: 'address',
        sample: { street: '123 Main St', city: 'London' },
        children: [
          { key: 'street', sample: '123 Main St' },
          { key: 'city', sample: 'London' },
        ],
      },
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
          'Invalid value for key: children (must be array of PlainOutputFieldSchema)',
      },
    ],
    additionalProperties: false,
  },
  [PlainFieldSchema],
);
