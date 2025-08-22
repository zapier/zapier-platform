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
      type: 'create',
      noun: 'Foo',
      display: {
        label: 'Create Foo',
        description: 'Creates a...',
      },
      operation,
    },
  },
};

describe('bufferedCreateConstraints', () => {
  it('should error on creates with both perform and buffer defined without performBuffer', () => {
    operation.perform = '$func$2$f$';
    operation.buffer = {
      groupedBy: ['orderId'],
      limit: 10,
    };
    delete operation.performBuffer;

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(2);
    results.errors[0].stack.should.eql(
      'instance.creates.foo.operation must contain property "performBuffer" because property "buffer" is present.',
    );
    results.errors[1].stack.should.eql(
      'instance.creates.foo.operation must not contain property "perform" because it is mutually exclusive with property "buffer".',
    );
  });

  it('should error on creates with both perform and performBuffer defined without buffer', () => {
    operation.perform = '$func$2$f$';
    operation.performBuffer = '$func$2$f$';
    delete operation.buffer;

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(2);
    results.errors[0].stack.should.eql(
      'instance.creates.foo.operation must contain property "buffer" because property "performBuffer" is present.',
    );
    results.errors[1].stack.should.eql(
      'instance.creates.foo.operation must not contain property "perform" because it is mutually exclusive with property "performBuffer".',
    );
  });

  it('should error on creates with buffer defined without perform and performBuffer', () => {
    operation.buffer = {
      groupedBy: ['orderId'],
      limit: 10,
    };
    delete operation.perform;
    delete operation.performBuffer;

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.creates.foo.operation must contain property "performBuffer" because property "buffer" is present.',
    );
  });

  it('should error on creates with buffer defined without perform and performBuffer, and with groupedBy using optional inputFields', () => {
    operation.buffer = {
      groupedBy: ['location'],
      limit: 10,
    };
    delete operation.perform;
    delete operation.performBuffer;

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(2);
    results.errors[0].stack.should.eql(
      'instance.creates.foo.operation must contain property "performBuffer" because property "buffer" is present.',
    );
    results.errors[1].stack.should.eql(
      'instance.creates.foo.operation.buffer.groupedBy[0] cannot use optional or non-existent inputField "location".',
    );
  });

  it('should error on creates with performBuffer defined without buffer and perform', () => {
    operation.performBuffer = '$func$2$f$';
    delete operation.perform;
    delete operation.buffer;

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.creates.foo.operation must contain property "buffer" because property "performBuffer" is present.',
    );
  });

  it('should error on creates with none of perform, buffer, and performBuffer defined', () => {
    delete operation.buffer;
    delete operation.perform;
    delete operation.performBuffer;

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.creates.foo.operation requires property "perform".',
    );
  });

  it('should not error on creates with both buffer and performBuffer defined without perform', () => {
    operation.performBuffer = '$func$2$f$';
    operation.buffer = {
      groupedBy: ['orderId'],
      limit: 10,
    };
    delete operation.perform;

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(0);
  });

  it('should not error on creates with perform defined without buffer and performBuffer', () => {
    operation.perform = '$func$2$f$';
    delete operation.buffer;
    delete operation.performBuffer;

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(0);
  });
});
