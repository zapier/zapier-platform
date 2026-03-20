'use strict';

require('should');
const schema = require('../../schema');

describe('schemaRequiresJsonType', () => {
  describe('standard action validation', () => {
    it('should not error when type is json and schema is provided', () => {
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
      };

      const results = schema.validateAppDefinition(definition);
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
                  schema: {
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
                  },
                },
              ],
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(0);
    });

    it('should not error for an empty schema object', () => {
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
                  schema: {},
                },
              ],
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(0);
    });

    it('should not error for a schema with type as an array', () => {
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
                  schema: {
                    type: ['string', 'null'],
                  },
                },
              ],
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(0);
    });

    it('should not error for a schema using allOf/anyOf/oneOf/not', () => {
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
                  schema: {
                    allOf: [
                      { type: 'object' },
                      {
                        properties: {
                          name: { type: 'string' },
                        },
                      },
                    ],
                    not: { type: 'array' },
                  },
                },
              ],
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(0);
    });

    it('should error for an invalid type value', () => {
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
                  schema: { type: 'not-a-type' },
                },
              ],
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(1);
      results.errors[0].stack.should.containEql('invalid JSON Schema');
      results.errors[0].stack.should.containEql('invalid type "not-a-type"');
    });

    it('should error for an invalid type in a nested property', () => {
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
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'not-a-type' },
                    },
                  },
                },
              ],
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(1);
      results.errors[0].stack.should.containEql('invalid type "not-a-type"');
    });

    it('should error when required is not an array', () => {
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
                  schema: {
                    type: 'object',
                    required: 'name',
                  },
                },
              ],
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(1);
      results.errors[0].stack.should.containEql('required: must be an array');
    });

    it('should error when properties contains a non-object value', () => {
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
                  schema: {
                    type: 'object',
                    properties: {
                      name: 'should be an object',
                    },
                  },
                },
              ],
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(1);
      results.errors[0].stack.should.containEql(
        'must be a valid JSON Schema object',
      );
    });

    it('should report multiple errors for multiple invalid fields', () => {
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
                  schema: {
                    type: 'badtype',
                    required: 'not-array',
                  },
                },
              ],
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(2);
    });

    it('should error for invalid items schema', () => {
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
                  schema: {
                    type: 'array',
                    items: 'not-a-schema',
                  },
                },
              ],
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(1);
      results.errors[0].stack.should.containEql(
        'must be a valid JSON Schema object',
      );
    });

    it('should error for invalid enum value', () => {
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
                  schema: {
                    type: 'string',
                    enum: 'not-an-array',
                  },
                },
              ],
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
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
});
