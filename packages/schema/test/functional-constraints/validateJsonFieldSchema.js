'use strict';

require('should');
const schema = require('../../schema');

// Helper to create a minimal app definition with a single json input field
const makeDefinition = (fieldSchema) => ({
  version: '1.0.0',
  platformVersion: '1.0.0',
  creates: {
    foo: {
      key: 'foo',
      noun: 'Foo',
      display: {
        label: 'Create Foo',
        description: 'Creates a...',
      },
      operation: {
        perform: '$func$2$f$',
        sample: { id: 1 },
        inputFields: [
          {
            key: 'payload',
            type: 'json',
            schema: fieldSchema,
          },
        ],
      },
    },
  },
});

describe('validateJsonFieldSchema', () => {
  describe('standard action validation', () => {
    it('should not error when type is json and schema is provided', () => {
      const results = schema.validateAppDefinition(
        makeDefinition({
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        }),
      );
      results.errors.should.have.length(0);
    });

    it('should not error when type is json without schema', () => {
      const definition = {
        version: '1.0.0',
        platformVersion: '1.0.0',
        creates: {
          foo: {
            key: 'foo',
            noun: 'Foo',
            display: {
              label: 'Create Foo',
              description: 'Creates a...',
            },
            operation: {
              perform: '$func$2$f$',
              sample: { id: 1 },
              inputFields: [
                {
                  key: 'payload',
                  type: 'json',
                },
              ],
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(0);
    });

    it('should error when schema is provided without type json', () => {
      const definition = {
        version: '1.0.0',
        platformVersion: '1.0.0',
        creates: {
          foo: {
            key: 'foo',
            noun: 'Foo',
            display: {
              label: 'Create Foo',
              description: 'Creates a...',
            },
            operation: {
              perform: '$func$2$f$',
              sample: { id: 1 },
              inputFields: [
                {
                  key: 'payload',
                  type: 'string',
                  schema: { type: 'object' },
                },
              ],
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(1);
      results.errors[0].stack.should.containEql(
        'must have `type` set to `json` when `schema` is provided',
      );
    });
  });

  describe('JSON Schema validation', () => {
    it('should not error for a valid JSON Schema', () => {
      const results = schema.validateAppDefinition(
        makeDefinition({
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'integer' },
            tags: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['name'],
          additionalProperties: false,
        }),
      );
      results.errors.should.have.length(0);
    });

    it('should not error for an empty schema object', () => {
      const results = schema.validateAppDefinition(makeDefinition({}));
      results.errors.should.have.length(0);
    });

    it('should not error for a schema with type as an array', () => {
      const results = schema.validateAppDefinition(
        makeDefinition({
          type: ['string', 'null'],
        }),
      );
      results.errors.should.have.length(0);
    });

    it('should not error for a schema using allOf/anyOf/oneOf/not', () => {
      const results = schema.validateAppDefinition(
        makeDefinition({
          allOf: [
            { type: 'object' },
            {
              properties: {
                name: { type: 'string' },
              },
            },
          ],
          not: { type: 'array' },
        }),
      );
      results.errors.should.have.length(0);
    });

    it('should error for an invalid type value', () => {
      const results = schema.validateAppDefinition(
        makeDefinition({ type: 'not-a-type' }),
      );
      results.errors.should.have.length(1);
      results.errors[0].stack.should.containEql('invalid JSON Schema');
      results.errors[0].stack.should.containEql('invalid type "not-a-type"');
    });

    it('should error for an invalid type in a nested property', () => {
      const results = schema.validateAppDefinition(
        makeDefinition({
          type: 'object',
          properties: {
            name: { type: 'not-a-type' },
          },
        }),
      );
      results.errors.should.have.length(1);
      results.errors[0].stack.should.containEql('invalid type "not-a-type"');
    });

    it('should error when required is not an array', () => {
      const results = schema.validateAppDefinition(
        makeDefinition({
          type: 'object',
          required: 'name',
        }),
      );
      results.errors.should.have.length(1);
      results.errors[0].stack.should.containEql('required: must be an array');
    });

    it('should error when properties contains a non-object value', () => {
      const results = schema.validateAppDefinition(
        makeDefinition({
          type: 'object',
          properties: {
            name: 'should be an object',
          },
        }),
      );
      results.errors.should.have.length(1);
      results.errors[0].stack.should.containEql(
        'must be a valid JSON Schema object',
      );
    });

    it('should report multiple errors for multiple invalid fields', () => {
      const results = schema.validateAppDefinition(
        makeDefinition({
          type: 'badtype',
          required: 'not-array',
        }),
      );
      results.errors.should.have.length(2);
    });

    it('should error for invalid items schema', () => {
      const results = schema.validateAppDefinition(
        makeDefinition({
          type: 'array',
          items: 'not-a-schema',
        }),
      );
      results.errors.should.have.length(1);
      results.errors[0].stack.should.containEql(
        'must be a valid JSON Schema object',
      );
    });

    it('should error for invalid enum value', () => {
      const results = schema.validateAppDefinition(
        makeDefinition({
          type: 'string',
          enum: 'not-an-array',
        }),
      );
      results.errors.should.have.length(1);
      results.errors[0].stack.should.containEql('enum: must be an array');
    });

    it('should validate schemas in resources', () => {
      const definition = {
        version: '1.0.0',
        platformVersion: '1.0.0',
        resources: {
          contact: {
            key: 'contact',
            noun: 'Contact',
            create: {
              display: {
                label: 'Create Contact',
                description: 'Create a new contact',
              },
              operation: {
                perform: '$func$2$f$',
                inputFields: [
                  {
                    key: 'payload',
                    type: 'json',
                    schema: { type: 'badtype' },
                  },
                ],
              },
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(1);
      results.errors[0].stack.should.containEql('invalid type "badtype"');
    });
  });

  describe('children field validation', () => {
    it('should not error for valid schema in a child field', () => {
      const definition = {
        version: '1.0.0',
        platformVersion: '1.0.0',
        creates: {
          foo: {
            key: 'foo',
            noun: 'Foo',
            display: {
              label: 'Create Foo',
              description: 'Creates a...',
            },
            operation: {
              perform: '$func$2$f$',
              sample: { id: 1 },
              inputFields: [
                {
                  key: 'parent',
                  children: [
                    {
                      key: 'nested_json',
                      type: 'json',
                      schema: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                        },
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(0);
    });

    it('should error for invalid schema in a child field', () => {
      const definition = {
        version: '1.0.0',
        platformVersion: '1.0.0',
        creates: {
          foo: {
            key: 'foo',
            noun: 'Foo',
            display: {
              label: 'Create Foo',
              description: 'Creates a...',
            },
            operation: {
              perform: '$func$2$f$',
              sample: { id: 1 },
              inputFields: [
                {
                  key: 'parent',
                  children: [
                    {
                      key: 'nested_json',
                      type: 'json',
                      schema: { type: 'badtype' },
                    },
                  ],
                },
              ],
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(1);
      results.errors[0].stack.should.containEql('invalid type "badtype"');
    });

    it('should error for schema without type json in a child field', () => {
      const definition = {
        version: '1.0.0',
        platformVersion: '1.0.0',
        creates: {
          foo: {
            key: 'foo',
            noun: 'Foo',
            display: {
              label: 'Create Foo',
              description: 'Creates a...',
            },
            operation: {
              perform: '$func$2$f$',
              sample: { id: 1 },
              inputFields: [
                {
                  key: 'parent',
                  children: [
                    {
                      key: 'nested_json',
                      type: 'string',
                      schema: { type: 'object' },
                    },
                  ],
                },
              ],
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(1);
      results.errors[0].stack.should.containEql(
        'must have `type` set to `json` when `schema` is provided',
      );
    });
  });

  describe('resource validation', () => {
    it('should not error when type is json and schema is provided', () => {
      const definition = {
        version: '1.0.0',
        platformVersion: '1.0.0',
        resources: {
          contact: {
            key: 'contact',
            noun: 'Contact',
            create: {
              display: {
                label: 'Create Contact',
                description: 'Create a new contact',
              },
              operation: {
                perform: '$func$2$f$',
                inputFields: [
                  {
                    key: 'payload',
                    type: 'json',
                    schema: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(0);
    });

    it('should error when schema is provided without type json', () => {
      const definition = {
        version: '1.0.0',
        platformVersion: '1.0.0',
        resources: {
          contact: {
            key: 'contact',
            noun: 'Contact',
            create: {
              display: {
                label: 'Create Contact',
                description: 'Create a new contact',
              },
              operation: {
                perform: '$func$2$f$',
                inputFields: [
                  {
                    key: 'payload',
                    type: 'string',
                    schema: { type: 'object' },
                  },
                ],
              },
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(1);
      results.errors[0].stack.should.containEql(
        'must have `type` set to `json` when `schema` is provided',
      );
    });
  });

  describe('$schema draft version support', () => {
    it('should not error for a schema with no $schema (defaults to Draft 4)', () => {
      const results = schema.validateAppDefinition(
        makeDefinition({
          type: 'object',
          properties: { name: { type: 'string' } },
        }),
      );
      results.errors.should.have.length(0);
    });

    it('should not error for a schema with explicit Draft 4 $schema', () => {
      const results = schema.validateAppDefinition(
        makeDefinition({
          $schema: 'http://json-schema.org/draft-04/schema#',
          type: 'object',
          properties: { name: { type: 'string' } },
        }),
      );
      results.errors.should.have.length(0);
    });

    it('should not error for a schema with Draft 6 $schema', () => {
      const results = schema.validateAppDefinition(
        makeDefinition({
          $schema: 'http://json-schema.org/draft-06/schema#',
          type: 'object',
          properties: { name: { type: 'string' } },
        }),
      );
      results.errors.should.have.length(0);
    });

    it('should not error for a schema with Draft 7 $schema', () => {
      const results = schema.validateAppDefinition(
        makeDefinition({
          $schema: 'http://json-schema.org/draft-07/schema#',
          type: 'object',
          properties: { name: { type: 'string' } },
        }),
      );
      results.errors.should.have.length(0);
    });

    it('should not error for a Draft 7 $schema without trailing #', () => {
      const results = schema.validateAppDefinition(
        makeDefinition({
          $schema: 'http://json-schema.org/draft-07/schema',
          type: 'object',
          properties: { name: { type: 'string' } },
        }),
      );
      results.errors.should.have.length(0);
    });

    it('should not error for a Draft 7 schema using if/then/else', () => {
      const results = schema.validateAppDefinition(
        makeDefinition({
          $schema: 'http://json-schema.org/draft-07/schema#',
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['a', 'b'] },
            value: { type: 'string' },
          },
          if: { properties: { type: { const: 'a' } } },
          then: { required: ['value'] },
          else: {},
        }),
      );
      results.errors.should.have.length(0);
    });

    it('should error for unsupported Draft 2019-09 $schema', () => {
      const results = schema.validateAppDefinition(
        makeDefinition({
          $schema: 'https://json-schema.org/draft/2019-09/schema',
          type: 'object',
        }),
      );
      results.errors.should.have.length(1);
      results.errors[0].stack.should.containEql(
        'unsupported JSON Schema version',
      );
    });

    it('should error for unsupported Draft 2020-12 $schema', () => {
      const results = schema.validateAppDefinition(
        makeDefinition({
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
        }),
      );
      results.errors.should.have.length(1);
      results.errors[0].stack.should.containEql(
        'unsupported JSON Schema version',
      );
    });

    it('should error for an unrecognized $schema URI', () => {
      const results = schema.validateAppDefinition(
        makeDefinition({
          $schema: 'https://example.com/my-custom-schema',
          type: 'object',
        }),
      );
      results.errors.should.have.length(1);
      results.errors[0].stack.should.containEql(
        'unsupported JSON Schema version',
      );
      results.errors[0].stack.should.containEql('Supported versions');
    });
  });
});
