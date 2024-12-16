'use strict';

require('should');
const schema = require('../../schema');

describe('mutuallyExclusiveFields', () => {
  it('should not error on fields not mutually exclusive', () => {
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

  it('should error on fields that have children and list', () => {
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
              { key: 'orderId', type: 'number' },
              {
                key: 'line_items',
                children: [
                  {
                    key: 'product',
                  },
                ],
                list: true,
              },
            ],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      "instance.creates.foo.inputFields[1] must not contain children and list, as they're mutually exclusive.",
    );
  });

  it('should not error on fields that have children and list when list is false', () => {
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
              { key: 'orderId', type: 'number' },
              {
                key: 'line_items',
                children: [
                  {
                    key: 'product',
                  },
                ],
                list: false,
              },
            ],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(0);
  });

  it('should error on fields that have list and dict', () => {
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
              { key: 'orderId', type: 'number' },
              {
                key: 'line_items',
                dict: true,
                list: true,
              },
            ],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      "instance.creates.foo.inputFields[1] must not contain dict and list, as they're mutually exclusive.",
    );
  });

  it('should error on fields that have dynamic and dict', () => {
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
                key: 'orderId',
                type: 'number',
                dynamic: 'foo.id.number',
                dict: true,
              },
              {
                key: 'line_items',
                list: true,
              },
            ],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      "instance.creates.foo.inputFields[0] must not contain dynamic and dict, as they're mutually exclusive.",
    );
  });

  it('should not error on fields that have dynamic and dict when dict is false', () => {
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
                key: 'orderId',
                type: 'number',
                dynamic: 'foo.id.number',
                dict: false,
              },
              {
                key: 'line_items',
                list: true,
              },
            ],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(0);
  });

  it('should error on fields that have dynamic and choices', () => {
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
                key: 'orderId',
                type: 'number',
                dynamic: 'foo.id.number',
                choices: {
                  uno: 1,
                  dos: 2,
                },
              },
              {
                key: 'line_items',
                list: true,
              },
            ],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      "instance.creates.foo.inputFields[0] must not contain dynamic and choices, as they're mutually exclusive.",
    );
  });
});
