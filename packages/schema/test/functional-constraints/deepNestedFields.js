'use strict';

require('should');
const schema = require('../../schema');

describe('deepNestedFields', () => {
  it('should not error on fields nested one level deep', () => {
    const definition = {
      version: '1.0.0',
      platformVersion: '1.0.0',
      creates: {
        foo: {
          key: 'foo',
          type: 'create',
          noun: 'Foo',
          display: {
            label: 'Create Foo',
            description: 'Creates a...',
          },
          operation: {
            perform: '$func$2$f$',
            sample: { id: 1 },
            inputFields: [
              { key: 'orderId', type: 'number' },
              {
                key: 'line_items',
                children: [
                  {
                    key: 'product',
                    type: 'string',
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

  it('should error on fields nested more than one level deep', () => {
    const definition = {
      version: '1.0.0',
      platformVersion: '1.0.0',
      creates: {
        foo: {
          key: 'foo',
          type: 'create',
          noun: 'Foo',
          display: {
            label: 'Create Foo',
            description: 'Creates a...',
          },
          operation: {
            perform: '$func$2$f$',
            sample: { id: 1 },
            inputFields: [
              { key: 'orderId', type: 'number' },
              {
                key: 'line_items',
                children: [
                  { key: 'some do not have children' },
                  {
                    key: 'product',
                    children: [{ key: 'name', type: 'string' }],
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
    results.errors[0].stack.should.eql(
      'instance.creates.foo.inputFields[1] must not contain deeply nested child fields. One level max.',
    );
  });
});
