'use strict';

const makeSchema = require('../utils/makeSchema');

const VALID_JSON_SCHEMA_TYPES = [
  'object',
  'array',
  'string',
  'number',
  'integer',
  'boolean',
  'null',
];

module.exports = makeSchema({
  id: '/JsonSchemaSchema',
  description:
    'A JSON Schema (Draft 4 subset) that describes the expected structure of a JSON value.',
  type: 'object',
  properties: {
    type: {
      description: 'The JSON Schema type or array of types.',
      anyOf: [
        { type: 'string', enum: VALID_JSON_SCHEMA_TYPES },
        {
          type: 'array',
          items: { type: 'string', enum: VALID_JSON_SCHEMA_TYPES },
          minItems: 1,
          uniqueItems: true,
        },
      ],
    },
    properties: {
      description: 'An object mapping property names to their JSON Schemas.',
      type: 'object',
      additionalProperties: { $ref: '/JsonSchemaSchema' },
    },
    items: {
      description:
        'Schema for array items. Can be a single schema or an array of schemas.',
      anyOf: [
        { $ref: '/JsonSchemaSchema' },
        {
          type: 'array',
          items: { $ref: '/JsonSchemaSchema' },
          minItems: 1,
        },
      ],
    },
    required: {
      description: 'An array of required property names.',
      type: 'array',
      items: { type: 'string' },
    },
    additionalProperties: {
      description:
        'Whether additional properties are allowed, or a schema they must match.',
      anyOf: [{ type: 'boolean' }, { $ref: '/JsonSchemaSchema' }],
    },
    allOf: {
      description: 'An array of schemas that the value must match all of.',
      type: 'array',
      items: { $ref: '/JsonSchemaSchema' },
      minItems: 1,
    },
    anyOf: {
      description:
        'An array of schemas that the value must match at least one of.',
      type: 'array',
      items: { $ref: '/JsonSchemaSchema' },
      minItems: 1,
    },
    oneOf: {
      description:
        'An array of schemas that the value must match exactly one of.',
      type: 'array',
      items: { $ref: '/JsonSchemaSchema' },
      minItems: 1,
    },
    not: {
      description: 'A schema that the value must not match.',
      $ref: '/JsonSchemaSchema',
    },
    enum: {
      description: 'An array of allowed values.',
      type: 'array',
      minItems: 1,
    },
  },
  additionalProperties: true,
  examples: [
    { type: 'object', properties: { name: { type: 'string' } } },
    { type: 'array', items: { type: 'string' } },
    { type: ['string', 'null'] },
    {},
    {
      allOf: [{ type: 'object' }, { properties: { name: { type: 'string' } } }],
      not: { type: 'array' },
    },
    {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
      },
      required: ['name'],
      additionalProperties: false,
    },
  ],
  antiExamples: [
    {
      example: { type: 'foobar' },
      reason: 'Invalid JSON Schema type value',
    },
    {
      example: { type: 'object', required: 'name' },
      reason: 'required must be an array',
    },
    {
      example: { type: 'string', enum: 'not-an-array' },
      reason: 'enum must be an array',
    },
  ],
});
