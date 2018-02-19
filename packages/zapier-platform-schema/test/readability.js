'use strict';

require('should');

const AuthenticationSchema = require('../lib/schemas/AuthenticationSchema');
const CreateSchema = require('../lib/schemas/CreateSchema');

describe('readability', () => {
  it('should have decent messages for anyOf mismatches', () => {
    const results = AuthenticationSchema.validate({
      type: 'oauth2',
      test: 'whateverfake!'
    });
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.test is not exactly one from </RequestSchema>,</FunctionSchema>'
    );
  });

  it('should have decent messages for minimum length not met', () => {
    const results = CreateSchema.validate({
      key: 'recipe',
      noun: 'Recipe',
      display: {
        label: '',
        description: 'Creates a new recipe.'
      },
      operation: {
        perform: '$func$2$f$',
        sample: { id: 1 }
      }
    });
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.display.label does not meet minimum length of 2'
    );
  });

  it('should have decent messages for value type mismatch', () => {
    let results = CreateSchema.validate({
      key: 'recipe',
      noun: 'Recipe',
      display: {
        label: 'Create Recipe',
        description: 'Creates a new recipe.'
      },
      operation: {
        perform: '$func$2$f$',
        sample: { id: 1 },
        inputFields: [false]
      }
    });
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.operation.inputFields[0] is not exactly one from </FieldSchema>,</FunctionSchema>'
    );

    results = CreateSchema.validate({
      key: 'recipe',
      noun: 'Recipe',
      display: {
        label: 'Create Recipe',
        description: 'Creates a new recipe.'
      },
      operation: {
        perform: '$func$2$f$',
        sample: { id: 1 },
        inputFields: [{ key: 'field', type: 'string', default: '' }]
      }
    });
    results.errors.should.have.length(1);
    // Ideally it would be the commented version, but it would require significant changes in jsonschema
    // results.errors[0].stack.should.eql('instance.operation.inputFields[0].default does not meet minimum length of 1');
    results.errors[0].stack.should.eql(
      'instance.operation.inputFields[0] is not exactly one from </FieldSchema>,</FunctionSchema>'
    );
  });
});
