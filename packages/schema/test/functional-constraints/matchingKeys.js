'use strict';

require('should');
const schema = require('../../schema');

describe('matchingKeys', () => {
  it("should error if the keys don't match", () => {
    const definition = {
      version: '1.0.0',
      platformVersion: '1.0.0',
      triggers: {}, // this should be harmlessly skipped
      creates: {
        foo: {
          key: 'bar', // this is different than above, which shouldn't validate
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
    results.errors.should.have.length(1);
  });
});
