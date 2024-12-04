'use strict';

const makeSchema = require('../utils/makeSchema');

const RefResourceSchema = require('./RefResourceSchema');

const FieldChoicesSchema = require('./FieldChoicesSchema');

const FieldMetaSchema = require('./FieldMetaSchema');

const { INCOMPATIBLE_FIELD_SCHEMA_KEYS } = require('../constants');

// the following takes an array of string arrays (string[][]) and returns the follwing string:
// * `a` & `b`
// * `c` & `d`
// ... etc
const wrapInBackticks = (s) => `\`${s}\``;
const formatBullet = (f) => `* ${f.map(wrapInBackticks).join(' & ')}`;
const incompatibleFieldsList =
  INCOMPATIBLE_FIELD_SCHEMA_KEYS.map(formatBullet).join('\n');

module.exports = makeSchema(
  {
    id: '/FieldSchema',
    description: `Defines a field an app either needs as input, or gives as output. In addition to the requirements below, the following keys are mutually exclusive:\n\n${incompatibleFieldsList}`,
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
      helpText: {
        description:
          'A human readable description of this value (IE: "The first part of a full name."). You can use Markdown.',
        type: 'string',
        minLength: 1,
        maxLength: 1000,
      },
      type: {
        description:
          'The type of this value. Use `string` for basic text input, `text` for a large, `<textarea>` style box, and `code` for a `<textarea>` with a fixed-width font. Field type of `file` will accept either a file object or a string. If a URL is provided in the string, Zapier will automatically make a GET for that file. Otherwise, a .txt file will be generated.',
        type: 'string',
        // string == unicode
        // text == a long textarea string
        // integer == int
        // number == float
        enum: [
          'string',
          'text',
          'integer',
          'number',
          'boolean',
          'datetime',
          'file',
          'password',
          'copy',
          'code',
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
      default: {
        description:
          'A default value that is saved the first time a Zap is created.',
        type: 'string',
        minLength: 1,
      },
      primary: {
        description:
          'Use this field as part of the primary key for deduplication. You can set multiple fields as "primary", provided they are unique together. If no fields are set, Zapier will default to using the `id` field. `primary` only makes sense for `outputFields`; it will be ignored if set in `inputFields`. It only works in static `outputFields`; will not work in custom/dynamic `outputFields`. For more information, see [How deduplication works in Zapier](https://platform.zapier.com/build/deduplication).',
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
      choices: {
        description:
          'An object of machine keys and human values to populate a static dropdown.',
        $ref: FieldChoicesSchema.id,
      },
      list: {
        description:
          'Acts differently when used in inputFields vs. when used in outputFields. In inputFields: Can a user provide multiples of this field? In outputFields: Does this field return an array of items of type `type`?',
        type: 'boolean',
      },
      children: {
        type: 'array',
        items: { $ref: '/FieldSchema' },
        description:
          'An array of child fields that define the structure of a sub-object for this field. Usually used for line items.',
        minItems: 1,
      },
      dict: {
        description: 'Is this field a key/value input?',
        type: 'boolean',
      },
      computed: {
        description:
          'Is this field automatically populated (and hidden from the user)? Note: Only OAuth and Session Auth support fields with this key.',
        type: 'boolean',
      },
      altersDynamicFields: {
        description:
          'Does the value of this field affect the definitions of other fields in the set?',
        type: 'boolean',
      },
      steadyState: {
        description:
          'Prevents triggering on new output until all values for fields with this property remain unchanged for 2 polls. It can be used to, e.g., not trigger on a new contact until the contact has completed typing their name. NOTE that this only applies to the `outputFields` of polling triggers.',
        type: 'boolean',
      },
      inputFormat: {
        description:
          'Useful when you expect the input to be part of a longer string. Put "{{input}}" in place of the user\'s input (IE: "https://{{input}}.yourdomain.com").',
        type: 'string',
        // TODO: Check if it contains one and ONLY ONE '{{input}}'
        pattern: '^.*{{input}}.*$',
      },
      meta: {
        description:
          'Allows for additional metadata to be stored on the field. Supports simple key-values only (no sub-objects or arrays).',
        $ref: FieldMetaSchema.id,
      },
    },
    examples: [
      { key: 'abc' },
      { key: 'abc', choices: { mobile: 'Mobile Phone' } },
      { key: 'abc', choices: ['first', 'second', 'third'] },
      {
        key: 'abc',
        choices: [{ label: 'Red', sample: '#f00', value: '#f00' }],
      },
      { key: 'abc', children: [{ key: 'abc' }] },
      { key: 'abc', type: 'integer', helpText: 'neat' },
      {
        key: 'abc',
        type: 'integer',
        meta: {
          internalType: 'numeric',
          should_call_api: true,
          display_order: 1,
        },
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
          'Invalid value for key: children (must be array of FieldSchema)',
      },
    ],
    additionalProperties: false,
  },
  [RefResourceSchema, FieldChoicesSchema, FieldMetaSchema],
);
