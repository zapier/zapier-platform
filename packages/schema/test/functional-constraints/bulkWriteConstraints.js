'use strict';

require('should');
const schema = require('../../schema');

const operation = {
  sample: { id: 1 },
  inputFields: [
    { key: 'orderId', type: 'number', required: true },
    { key: 'location', type: 'string' },
  ],
};
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
      operation,
    },
  },
};

describe('bulkWriteConstraints', () => {
  it('should error on creates with both perform and bulk defined without performBulk', () => {
    operation.perform = '$func$2$f$';
    operation.bulk = {
      groupedBy: ['orderId'],
      limit: 10,
    };
    delete operation.performBulk;

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(2);
    results.errors[0].stack.should.eql(
      'instance.creates.foo.operation must contain property "performBulk" because property "bulk" is present.'
    );
    results.errors[1].stack.should.eql(
      'instance.creates.foo.operation must not contain property "perform" because it is mutually exclusive with property "bulk".'
    );
  });

  it('should error on creates with both perform and performBulk defined without bulk', () => {
    operation.perform = '$func$2$f$';
    operation.performBulk = '$func$2$f$';
    delete operation.bulk;

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(2);
    results.errors[0].stack.should.eql(
      'instance.creates.foo.operation must contain property "bulk" because property "performBulk" is present.'
    );
    results.errors[1].stack.should.eql(
      'instance.creates.foo.operation must not contain property "perform" because it is mutually exclusive with property "performBulk".'
    );
  });

  it('should error on creates with bulk defined without perform and performBulk', () => {
    operation.bulk = {
      groupedBy: ['orderId'],
      limit: 10,
    };
    delete operation.perform;
    delete operation.performBulk;

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.creates.foo.operation must contain property "performBulk" because property "bulk" is present.'
    );
  });

  it('should error on creates with bulk defined without perform and performBulk, and with groupedBy using optional inputFields', () => {
    operation.bulk = {
      groupedBy: ['location'],
      limit: 10,
    };
    delete operation.perform;
    delete operation.performBulk;

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(2);
    results.errors[0].stack.should.eql(
      'instance.creates.foo.operation must contain property "performBulk" because property "bulk" is present.'
    );
    results.errors[1].stack.should.eql(
      'instance.creates.foo.operation.bulk.groupedBy[0] cannot use optional or non-existent inputField "location".'
    );
  });

  it('should error on creates with performBulk defined without bulk and perform', () => {
    operation.performBulk = '$func$2$f$';
    delete operation.perform;
    delete operation.bulk;

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.creates.foo.operation must contain property "bulk" because property "performBulk" is present.'
    );
  });

  it('should error on creates with none of perform, bulk, and performBulk defined', () => {
    delete operation.bulk;
    delete operation.perform;
    delete operation.performBulk;

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.creates.foo.operation requires property "perform".'
    );
  });

  it('should not error on creates with both bulk and performBulk defined without perform', () => {
    operation.performBulk = '$func$2$f$';
    operation.bulk = {
      groupedBy: ['orderId'],
      limit: 10,
    };
    delete operation.perform;

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(0);
  });

  it('should not error on creates with perform defined without bulk and performBulk', () => {
    operation.perform = '$func$2$f$';
    delete operation.bulk;
    delete operation.performBulk;

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(0);
  });
});
