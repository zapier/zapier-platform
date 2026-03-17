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
