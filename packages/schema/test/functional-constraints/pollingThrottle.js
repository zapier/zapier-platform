'use strict';

require('should');
const schema = require('../../schema');

const operation = {
  type: 'polling',
  perform: '$func$2$f$',
  throttle: {
    window: 60,
    limit: 1,
    scope: ['account'],
  },
  sample: { id: 1 },
  inputFields: [
    { key: 'orderId', type: 'number', required: true },
    { key: 'location', type: 'string' },
  ],
};
const definition = {
  version: '1.0.0',
  platformVersion: '1.0.0',
  triggers: {
    foo: {
      key: 'foo',
      noun: 'Foo',
      display: {
        label: 'New Foo',
        description: 'Triggers when a new foo is added.',
      },
      operation,
    },
  },
};

describe('pollingThrottle', () => {
  it('should error on a polling trigger with the "retry" field set in its throttle configuration', () => {
    operation.throttle.retry = false;
    let results;

    // for polling trigger with operation.type set
    results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.triggers.foo.operation.throttle must not use the "retry" field for a polling trigger.',
    );

    // for polling trigger with operation.type unset
    delete operation.type;
    results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.triggers.foo.operation.throttle must not use the "retry" field for a polling trigger.',
    );
  });

  it('should not error on a polling trigger without the "retry" field set in its throttle configuration', () => {
    delete operation.throttle.retry;

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(0);
  });
});
