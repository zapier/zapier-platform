'use strict';

const makeSchema = require('../utils/makeSchema');

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
      description: 'An purely example value that is not saved.',
      type: 'string',
      minLength: 1,
    },
    'default': {
      description: 'A default value that is saved the first time.',
      type: 'string',
      minLength: 1,
    },
    dynamic: {
      description: 'A reference to another resource or trigger that will power a dynamic dropdown.',
      $ref: RefResourceSchema.id,
    },
    search: {
      description: 'A reference to another resource or search that will allow adding a search for this field.',
      $ref: RefResourceSchema.id,
    },
    choices: {
      description: 'A list of machine keys and human values to power a static dropdown.',
      type: 'object',
      minProperties: 1,
    },
    list: {
      // if true:
      //   same as parentKey/line items if children
      //   flat array if no children
      // if false:
      //   means type=dict if children
      //   regular field if no children
      description: 'Can a user provide multiples of this field?',
      type: 'boolean',
    },
    children: {
      description: 'Can a user provide multiples of this field?',
      // TODO: don't allow deep nesting?
      // $ref: FieldsSchema.id,
    },
    computed: {
      description: 'Is this field automatically populated (and hidden from the user)?',
      type: 'boolean'
    },
    altersDynamicFields: {
      description: 'Does the value of this field affect the definitions of other fields in the set?',
      type: 'boolean'
    }
  },
  additionalProperties: false,
}, [
  RefResourceSchema,
]);
