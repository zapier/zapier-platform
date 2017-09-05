'use strict';

const makeSchema = require('../utils/makeSchema');

const FieldsSchema = require('./FieldsSchema');

const RefResourceSchema = require('./RefResourceSchema');

module.exports = makeSchema({
  id: '/FieldSchema',
  description: 'Defines a field an app either needs as input, or gives as output.',
  type: 'object',
  examples: [
    {key: 'abc'},
    {key: 'abc', choices: {mobile: 'Mobile Phone'}},
    {key: 'abc', children: []},
    {key: 'abc', children: [{key: 'abc'}]},
    {key: 'abc', children: [{key: 'abc', children: []}]},
    {key: 'abc', type: 'integer'},
  ],
  antiExamples: [
    {},
    {key: 'abc', choices: {}},
    {key: 'abc', choices: []},
    {key: 'abc', choices: ['mobile']},
    {key: 'abc', choices: 'mobile'},
    {key: 'abc', type: 'loltype'},
  ],
  required: ['key'],
  properties: {
    key: {
      description: 'A unique machine readable key for this value (IE: "fname").',
      type: 'string',
      minLength: 1,
    },
    label: {
      description: 'A human readable label for this value (IE: "First Name").',
      type: 'string',
      minLength: 1,
    },
    helpText: {
      description: 'A human readable description of this value (IE: "The first part of a full name.").',
      type: 'string',
      minLength: 10,
      maxLength: 1000,
    },
    type: {
      description: 'The type of this value.',
      type: 'string',
      // string == unicode
      // text == a long textarea string
      // integer == int
      // number == float
      enum: ['string', 'text', 'integer', 'number',
             'boolean', 'datetime', 'file', 'password'],
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
    'default': {
      description: 'A default value that is saved the first time a Zap is created.',
      type: 'string',
      minLength: 1,
    },
    dynamic: {
      description: 'A reference to a trigger that will power a dynamic dropdown.',
      $ref: RefResourceSchema.id,
    },
    search: {
      description: 'A reference to a search that will guide the user to add a search step to populate this field when creating a Zap.',
      $ref: RefResourceSchema.id,
    },
    choices: {
      description: 'An object of machine keys and human values to populate a static dropdown.',
      type: 'object',
      minProperties: 1,
    },
    list: {
      description: 'Can a user provide multiples of this field?',
      type: 'boolean',
    },
    children: {
      description: 'An array of child fields that define the structure of a sub-object for this field. Usually used for line items.',
      $ref: FieldsSchema.id,
    },
    dict: {
      description: 'Is this field a key/value input?',
      type: 'boolean',
    },
    computed: {
      description: 'Is this field automatically populated (and hidden from the user)?',
      type: 'boolean',
    },
    altersDynamicFields: {
      description: 'Does the value of this field affect the definitions of other fields in the set?',
      type: 'boolean',
    },
    inputFormat: {
      description: 'Useful when you expect the input to be part of a longer string. Put "{{input}}" in place of the user\'s input (IE: "https://{{input}}.yourdomain.com").',
      type: 'string',
      // TODO: Check if it contains one and ONLY ONE '{{input}}'
      pattern: '^.*\{\{input\}\}.*$'
    },
  },
  additionalProperties: false,
}, [
  RefResourceSchema,
]);
