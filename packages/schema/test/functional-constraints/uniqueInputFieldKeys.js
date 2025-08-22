'use strict';

require('should');
const schema = require('../../schema');

describe('uniqueInputFieldKeys', () => {
  it('should error when fields are repeated', () => {
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
            inputFields: [{ key: 'name' }, { key: 'name' }, { key: 'name' }],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(2);

    // all errors reference the first instance of `name`
    results.errors
      .every(
        (err) =>
          err.message ===
          'inputField keys must be unique for each action. The key "name" is already in use at creates.foo.operation.inputFields[0].key',
      )
      .should.be.true();
  });

  it('should error when fields nested fields are repeated', () => {
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
              {
                key: 'kids',
                children: [
                  { key: 'whatever' },
                  { key: 'name', type: 'number' },
                  { key: 'name', type: 'number' },
                ],
              },
              { key: 'name', type: 'number' },
            ],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(2);

    results.errors[0].message.should.eql(
      `inputField keys must be unique for each action, even if they're children. The key "name" is already in use at creates.foo.operation.inputFields[0].children[1].key`,
    );
    results.errors[1].message.should.eql(
      `inputField keys must be unique for each action. The key "name" is already in use at creates.foo.operation.inputFields[0].children[1].key`,
    );
  });

  it('should error when cousin fields are repeated', () => {
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
              { key: 'x', children: [{ key: 'name' }] },
              { key: 'y', children: [{ key: 'name' }] },
              { key: 'z', children: [{ key: 'name' }] },
            ],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(2);

    // all errors reference the first instance of `name`
    results.errors
      .every(
        (err) =>
          err.message ===
          `inputField keys must be unique for each action, even if they're children. The key "name" is already in use at creates.foo.operation.inputFields[0].children[0].key`,
      )
      .should.be.true();
  });

  it('should handle non-inputField objects', () => {
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
              // each of these is valid, but none declares a .key property
              '$func$2$f$', // dynamic fields
              '$func$2$f$',
              { source: 'return []' },
              { require: './some/js/file.js' },
            ],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(0);
  });
});
