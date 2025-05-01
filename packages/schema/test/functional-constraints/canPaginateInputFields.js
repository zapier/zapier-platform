'use strict';

require('should');
const schema = require('../../schema');

describe('canPaginateInputFields', () => {
  it('should return an error for input fields with canPaginate set and invalid dynamic', () => {
    const definition = {
      version: '1.0.0',
      platformVersion: '1.0.0',
      triggers: {
        testTrigger: {
          key: 'testTrigger',
          noun: 'testTrigger',
          display: {
            hidden: false,
            label: 'Create Foo',
            description: 'Creates a...',
          },
          operation: {
            perform: '$func$2$f$',
            inputFields: [
              { key: 'field1', canPaginate: true, dynamic: 'a.b.c' },
              { key: 'field3', canPaginate: false },
            ],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors.forEach((error) => {
      error.message.should.equal(
        'canPaginate can only be set for input fields if dynamic is a function or a request.',
      );
    });
  });

  it('should not return an error for valid input fields', () => {
    const validDefinition = {
      version: '1.0.0',
      platformVersion: '1.0.0',
      triggers: {
        validTrigger: {
          key: 'validTrigger',
          noun: 'validTrigger',
          display: {
            hidden: false,
            label: 'Create Foo',
            description: 'Creates a...',
          },
          operation: {
            perform: '$func$2$f$',
            inputFields: [
              { key: 'field1', canPaginate: true, dynamic: () => {} },
              { key: 'field2', canPaginate: false },
            ],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(validDefinition);
    results.errors.forEach((error) => {
      error.message.should.not.equal(
        'canPaginate can only be set for input fields if dynamic is a function or a request.',
      );
    });
  });
});
