'use strict';

const should = require('should');

const AuthenticationSchema = require('../lib/schemas/AuthenticationSchema');
const CreateSchema = require('../lib/schemas/CreateSchema');
const TriggerSchema = require('../lib/schemas/TriggerSchema');

describe('readability', () => {
  it('should have decent messages for anyOf mismatches', () => {
    const results = AuthenticationSchema.validate({
      type: 'oauth2',
      test: 'whateverfake!',
    });
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql('instance is not of a type(s) object');
    should(results.errors[0].property.endsWith('instance')).be.false();
  });

  it('should have decent messages for minimum length not met', () => {
    const results = TriggerSchema.validate({
      key: 'recipe',
      noun: 'Recipe',
      display: {
        label: '',
        description: 'Creates a new recipe.',
      },
      operation: {
        perform: '$func$2$f$',
        sample: { id: 1 },
      },
    });
    results.errors.should.have.length(1);
    should(results.errors[0].property.endsWith('instance')).be.false();
    results.errors[0].stack.should.eql(
      'instance.display.label does not meet minimum length of 2',
    );
  });

  it('should have decent messages for value type mismatch', () => {
    const results = CreateSchema.validate({
      key: 'recipe',
      noun: 'Recipe',
      display: {
        label: 'Create Recipe',
        description: 'Creates a new recipe.',
      },
      operation: {
        perform: '$func$2$f$',
        sample: { id: 1 },
        inputFields: [123],
      },
    });
    results.errors.should.have.length(1);
    should(results.errors[0].property.endsWith('instance')).be.false();
    results.errors[0].stack.should.eql('instance is not of a type(s) object');
  });

  it('should handle falsy values for objects', () => {
    const results = CreateSchema.validate({
      key: 'recipe',
      noun: 'Recipe',
      display: {
        label: 'Create Recipe',
        description: 'Creates a new recipe.',
      },
      operation: {
        perform: '$func$2$f$',
        sample: { id: 1 },
        inputFields: [0],
      },
    });
    results.errors.should.have.length(1);
    should(results.errors[0].property.endsWith('instance')).be.false();
    results.errors[0].stack.should.eql('instance is not of a type(s) object');
  });

  it('should surface deep issues', () => {
    const results = CreateSchema.validate({
      key: 'recipe',
      noun: 'Recipe',
      display: {
        label: 'Create Recipe',
        description: 'Creates a new recipe.',
      },
      operation: {
        perform: '$func$2$f$',
        sample: { id: 1 },
        inputFields: [{ key: 'field', type: 'string', children: [] }],
      },
    });
    results.errors.should.have.length(1);
    should(results.errors[0].property.endsWith('instance')).be.false();
    results.errors[0].property.should.eql(
      'instance.operation.inputFields[0].children',
    );
    results.errors[0].message.should.eql('does not meet minimum length of 1');
  });

  it('should correctly surface subschema types', () => {
    const results = CreateSchema.validate({
      key: 'recipe',
      noun: 'Recipe',
      display: {
        label: 'Create Recipe',
        description: 'Creates a new recipe.',
      },
      operation: {
        perform: {
          url: 'https://example.com',
          body: 123,
        },
        sample: { id: 1 },
      },
    });
    results.errors.should.have.length(1);
    results.errors[0].property.should.eql('instance.operation.perform.body');
    should(
      results.errors[0].message.includes('null,string,object,array'),
    ).be.true();
    should(results.errors[0].property.endsWith('instance')).be.false();
    results.errors[0].docLinks.length.should.eql(0);
  });

  it('should be helpful for fieldChoices', () => {
    const results = CreateSchema.validate({
      key: 'recipe',
      noun: 'Recipe',
      display: {
        label: 'Create Recipe',
        description: 'Creates a new recipe.',
      },
      operation: {
        perform: '$func$2$f$',
        sample: { id: 1 },
        inputFields: [
          {
            key: 'adsf',
            // schema says these should be strings
            choices: [1, 2, 3],
          },
        ],
      },
    });
    results.errors.should.have.length(1);
    results.errors[0].property.should.eql(
      'instance.operation.inputFields[0].choices',
    );
    should(
      results.errors[0].docLinks[0].includes('schema#fieldchoicesschema'),
    ).be.true();
    should(results.errors[0].property.endsWith('instance')).be.false();
  });
});
