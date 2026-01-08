'use strict';

const makeSchema = require('../utils/makeSchema');
const RefResourceSchema = require('./RefResourceSchema');
const FieldChoicesSchema = require('./FieldChoicesSchema');
const FieldDynamicChoicesSchema = require('./FieldDynamicChoicesSchema');
const PlainFieldSchema = require('./PlainFieldSchema');
const FieldMetaSchema = require('./FieldMetaSchema');
const KeySchema = require('./KeySchema');

module.exports = makeSchema(
  {
    description: `Field schema specialized for input fields. ${PlainFieldSchema.schema.description}`,
    id: '/PlainInputFieldSchema',
    type: 'object',
    required: ['key'],
    properties: {
      ...PlainFieldSchema.schema.properties,
      children: {
        type: 'array',
        items: { $ref: '/PlainInputFieldSchema' },
        description:
          'An array of child fields that define the structure of a sub-object for this field. Usually used for line items.',
        minItems: 1,
      },
      helpText: {
        description:
          'A human readable description of this value (IE: "The first part of a full name."). You can use Markdown.',
        type: 'string',
        minLength: 1,
        maxLength: 1000,
      },
      search: {
        description:
          'A reference to a search that will guide the user to add a search step to populate this field when creating a Zap.',
        $ref: RefResourceSchema.id,
      },
      dynamic: {
        description:
          'A reference to a trigger that will power a dynamic dropdown.',
        $ref: RefResourceSchema.id,
      },
      dependsOn: {
        description:
          "Specifies which other input fields this field depends on. These must be filled before this one becomes enabled, and when their values change, this field's value should be cleared.",
        type: 'array',
        items: { type: 'string' },
      },
      resource: {
        description:
          'Explicitly links this input field to a resource. Use the resource key (e.g., "spreadsheet") or dot notation for resource fields (e.g., "spreadsheet.url"). If not set for dynamic dropdowns, the resource is derived implicitly from the `dynamic` property.',
        type: 'string',
        minLength: 1,
      },
      choices: {
        description:
          'Describes how to populate this dropdown. Can be a static list or a dynamic object with pagination and search support.',
        oneOf: [
          { $ref: FieldChoicesSchema.id },
          { $ref: FieldDynamicChoicesSchema.id },
        ],
      },
      placeholder: {
        description: 'An example value that is not saved.',
        type: 'string',
        minLength: 1,
      },
      altersDynamicFields: {
        description:
          'Does the value of this field affect the definitions of other fields in the set?',
        type: 'boolean',
      },
      computed: {
        description:
          'Is this field automatically populated (and hidden from the user)? Note: Only OAuth, Session Auth, and certain internal use cases support fields with this key.',
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
      group: {
        description:
          "References a group key from the operation's inputFieldGroups to organize this field with others.",
        $ref: KeySchema.id,
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
      {
        key: 'abc',
        choices: { perform: '$func$0$f$' },
      },
      { key: 'abc', children: [{ key: 'abc' }] },
      { key: 'abc', type: 'integer' },
      {
        key: 'abc',
        type: 'integer',
        meta: {
          internalType: 'numeric',
          should_call_api: true,
          display_order: 1,
        },
      },
      {
        key: 'name',
        group: 'contact',
      },
      {
        key: 'email',
        group: 'contact',
      },
      {
        key: 'spreadsheet',
        dependsOn: ['folder'],
      },
      {
        key: 'worksheet',
        dependsOn: ['folder', 'spreadsheet'],
      },
      {
        key: 'spreadsheet_id',
        resource: 'spreadsheet',
        choices: { perform: '$func$0$f$' },
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
          'Invalid value for key: children (must be array of PlainInputFieldSchema)',
      },
    ],
    additionalProperties: false,
  },
  [
    RefResourceSchema,
    FieldChoicesSchema,
    FieldDynamicChoicesSchema,
    FieldMetaSchema,
    PlainFieldSchema,
    KeySchema,
  ],
);
