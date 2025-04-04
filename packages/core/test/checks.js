'use strict';

require('should');

const checks = require('../src/checks');
const checkOutput = require('../src/app-middlewares/after/checks');

const isTrigger = require('../src/checks/is-trigger');
const isSearch = require('../src/checks/is-search');
const isCreate = require('../src/checks/is-create');
const isFirehoseWebhook = require('../src/checks/is-firehose-webhook');

const testMethod = 'some.method';
const firehoseMethod = 'firehoseWebhooks.performSubscriptionKeyList';

describe('checks', () => {
  it('should return errors for anything but objects', () => {
    checks.createIsObject.run(testMethod, {}).length.should.eql(0);

    checks.createIsObject.run(testMethod, []).length.should.eql(1);
    checks.createIsObject.run(testMethod, '').length.should.eql(1);
    checks.createIsObject.run(testMethod, 1).length.should.eql(1);
    checks.createIsObject.run(testMethod, [{}]).length.should.eql(1);
    checks.createIsObject.run(testMethod, [{}, {}]).length.should.eql(1);
  });

  it('should error for objects via searchIsArray', () => {
    checks.searchIsArray.run(testMethod, [{}, {}]).length.should.eql(0);
    checks.searchIsArray.run(testMethod, [{}]).length.should.eql(0);
    checks.searchIsArray.run(testMethod, {}).length.should.eql(1);
  });

  it('should check for ids via triggerHasId', () => {
    checks.triggerHasId.run(testMethod, [{ id: 1 }]).length.should.eql(0);
    checks.triggerHasId
      .run(testMethod, [{ id: 1 }, { id: 2 }])
      .length.should.eql(0);
    checks.triggerHasId.run(testMethod, [{ game_id: 1 }]).length.should.eql(1);
    checks.triggerHasId.run(testMethod, []).length.should.eql(0, 'blank array');
    checks.triggerHasId.run(testMethod, [1]).length.should.eql(1);
    checks.triggerHasId.run(testMethod, [{ id: null }]).length.should.eql(1);
    checks.triggerHasId.run(testMethod, [{}]).length.should.eql(1);
  });

  it('should run triggerHasId when there are no primary fields', () => {
    const app = {
      triggers: {
        task: {
          operation: {
            outputFields: [{ key: 'project_id' }, { key: 'slug' }],
          },
        },
      },
    };
    const method = 'triggers.task.operation.perform';
    const bundle = {};
    checks.triggerHasId.shouldRun(method, bundle, app).should.be.true();
    checks.triggerHasId
      .run(method, [{ id: 1 }, { name: 'foo' }, { name: 'bar' }])
      .length.should.eql(1);
  });

  it('should not run triggerHasId when there are non-id primary fields', () => {
    const app = {
      triggers: {
        task: {
          operation: {
            outputFields: [
              { key: 'project_id', primary: true },
              { key: 'slug', primary: true },
            ],
          },
        },
      },
    };
    const method = 'triggers.task.operation.perform';
    const bundle = {};
    checks.triggerHasId.shouldRun(method, bundle, app).should.be.false();
  });

  it('should run triggerHasId if id follows another primary field', () => {
    const app = {
      triggers: {
        task: {
          operation: {
            outputFields: [
              { key: 'slug', primary: true },
              { key: 'id', primary: true },
            ],
          },
        },
      },
    };
    const method = 'triggers.task.operation.perform';
    const bundle = {};
    checks.triggerHasId.shouldRun(method, bundle, app).should.be.true();
  });

  it('should check for unique ids via triggerHasUniquePrimary', () => {
    checks.triggerHasUniquePrimary
      .run(testMethod, [{ id: 1 }, { id: 2 }])
      .length.should.eql(0);
    checks.triggerHasUniquePrimary
      .run(testMethod, [{ id: 1 }, { id: 1 }])
      .length.should.eql(1);

    checks.triggerHasUniquePrimary.run(testMethod, []).length.should.eql(0);
    checks.triggerHasUniquePrimary
      .run(testMethod, { throwsIfNull: null })
      .length.should.eql(0);
  });

  it('should check for unique primary keys via triggerHasUniquePrimary', () => {
    const app = {
      triggers: {
        task: {
          operation: {
            outputFields: [
              { key: 'id' },
              { key: 'project_id', primary: true },
              { key: 'slug', primary: true },
            ],
          },
        },
      },
    };
    const method = 'triggers.task.operation.perform';

    const errors = checks.triggerHasUniquePrimary.run(
      method,
      [
        // Some bad data to make sure the check doesn't break
        null,
        undefined,
        0,
        Infinity,
        NaN,
        { id: 1, project_id: 1, slug: 'foo' },
        { id: 2, project_id: 2, slug: 'foo' },
        { id: 3, project_id: 1, slug: 'foo' }, // duplicate!
      ],
      app,
    );
    errors.length.should.eql(1);

    const error = errors[0];
    error.should.containEql(
      'Got two or more results with primary key of `{"project_id":1,"slug":"foo"}`',
    );
  });

  it('should check type error via triggerHasUniquePrimary', () => {
    const app = {
      triggers: {
        task: {
          operation: {
            outputFields: [
              { key: 'id' },
              { key: 'project_id', primary: true },
              { key: 'slug', primary: true },
            ],
          },
        },
      },
    };
    const method = 'triggers.task.operation.perform';

    const errors = checks.triggerHasUniquePrimary.run(
      method,
      [
        { id: 1, project_id: 1, slug: 'foo' },
        // non-primitive can't be used as a primary key
        { id: 2, project_id: 2, slug: { foo: 'bar' } },
      ],
      app,
    );
    errors.length.should.eql(1);

    const error = errors[0];
    error.should.containEql('field "slug" must be a primitive');
  });

  it('should error for objects via triggerIsArray', () => {
    checks.triggerIsArray.run(testMethod, [{}, {}]).length.should.eql(0);
    checks.triggerIsArray.run(testMethod, []).length.should.eql(0);
    checks.triggerIsArray.run(testMethod, {}).length.should.eql(1);
  });

  it('should error for non-objects via triggerIsObject', () => {
    checks.triggerIsObject
      .run(testMethod, [''])
      .length.should.eql(1, 'empty string');
    checks.triggerIsObject
      .run(testMethod, [])
      .length.should.eql(0, 'empty array');
    checks.triggerIsObject
      .run(testMethod, [{}, {}])
      .length.should.eql(0, 'single object');
    checks.triggerIsObject
      .run(testMethod, [{}, []])
      .length.should.eql(1, 'mismatched objects');
  });

  it('should error for objects via firehoseSubscriptionIsArray', () => {
    checks.firehoseSubscriptionIsArray
      .run('firehoseWebhooks.performSubscriptionKeyList', ['test', 'teststr'])
      .length.should.eql(0);
    checks.firehoseSubscriptionIsArray
      .run(firehoseMethod, [])
      .length.should.eql(0);
    checks.firehoseSubscriptionIsArray
      .run(firehoseMethod, 'test')
      .length.should.eql(1);
    checks.firehoseSubscriptionIsArray
      .run(firehoseMethod, {})
      .length.should.eql(1);
  });

  it('should error for non-strings via firehoseSubscriptionKeyIsString', () => {
    checks.firehoseSubscriptionKeyIsString
      .run(firehoseMethod, [])
      .length.should.eql(0);
    checks.firehoseSubscriptionKeyIsString
      .run(firehoseMethod, ['test', 'test moar'])
      .length.should.eql(0);
    checks.firehoseSubscriptionKeyIsString
      .run(firehoseMethod, ['test', 2])
      .length.should.eql(1);
    checks.firehoseSubscriptionKeyIsString
      .run(firehoseMethod, [{}, {}])
      .length.should.eql(1);
  });

  it('should recognize types by name', () => {
    isTrigger('triggers.blah.operation.perform').should.be.true();
    isTrigger('resources.blah.list.operation.perform').should.be.true();
    isTrigger('blah').should.be.false();

    isSearch('searches.blah.operation.perform').should.be.true();
    isSearch('resources.blah.search.operation.perform').should.be.true();
    isSearch('blah').should.be.false();

    isCreate('creates.blah.operation.perform').should.be.true();
    isCreate('resources.blah.create.operation.perform').should.be.true();
    isCreate('blah').should.be.false();

    isFirehoseWebhook(firehoseMethod).should.be.true();
    isFirehoseWebhook('triggers.blah.operation.perform').should.be.false(); // the firehose webhook check is at app level, not trigger
  });

  it('should check performBuffer missing IDs', () => {
    const results = { one: {}, two: {} };
    const bundle = {
      buffer: [
        { meta: { id: 'one' } },
        { meta: { id: 'two' } },
        { meta: { id: 'three' } },
        { meta: { id: 'four' } },
        { meta: { id: 'five' } },
        { meta: { id: 'six' } },
        { meta: { id: 'seven' } },
        { meta: { id: 'eight' } },
        { meta: { id: 'nine' } },
      ],
    };
    const errors = checks.performBufferReturnType.run(
      'creates.blah.operation.performBuffer',
      results,
      {},
      bundle,
    );
    errors.length.should.eql(1);
    errors[0].should.match(
      /missing these IDs as keys: three, four, five, and 4 more/,
    );
  });

  it('should check performBuffer object shape', () => {
    const results = {
      one: 'not an object',
      two: { error: 123 },
      three: { outputData: {} },
      four: { error: 'test' },
      five: {
        outputData: 'this one should pass because it is not in the input',
      },
    };
    const bundle = {
      buffer: [
        { meta: { id: 'one' } },
        { meta: { id: 'two' } },
        { meta: { id: 'three' } },
        { meta: { id: 'four' } },
      ],
    };
    const errors = checks.performBufferReturnType.run(
      'creates.blah.operation.performBuffer',
      results,
      {},
      bundle,
    );
    errors.length.should.eql(2);
    errors[0].should.match(/member with ID 'one' must be an object/);
    errors[1].should.match(
      /member with ID 'two' must have 'outputData' object or 'error' string/,
    );
  });

  it('should pass performBuffer check', () => {
    const results = { one: { outputData: {} }, two: { outputData: {} } };
    const bundle = {
      buffer: [{ meta: { id: 'one' } }, { meta: { id: 'two' } }],
    };
    const errors = checks.performBufferReturnType.run(
      'creates.blah.operation.performBuffer',
      results,
      {},
      bundle,
    );
    errors.should.be.empty();
  });

  it('should error if input field is missing key', () => {
    const results = [{ key: 'foo' }, { title: 'bar' }, { status: 400 }];
    const errors = checks.dynamicFieldsHaveKeys.run(
      'creates.blah.operation.inputFields',
      results,
    );
    errors.length.should.eql(2);
    errors[0].should.eql('inputFields[1] is missing a key');
    errors[1].should.eql('inputFields[2] is missing a key');
  });

  it('should error if output field is missing key', () => {
    const results = [{ title: 'bar' }, { key: 'foo' }, { status: 400 }];
    const errors = checks.dynamicFieldsHaveKeys.run(
      'creates.blah.operation.outputFields',
      results,
    );
    errors.length.should.eql(2);
    errors[0].should.eql('outputFields[0] is missing a key');
    errors[1].should.eql('outputFields[2] is missing a key');
  });
});

describe('checkOutput', () => {
  it('should ensure trigger has id', () => {
    const output = {
      input: {
        _zapier: {
          event: {
            method: 'triggers.key.operation.perform',
            command: 'execute',
            bundle: {},
          },
        },
      },
      results: [{ text: 'An item without id' }],
    };

    (() => {
      checkOutput(output);
    }).should.throw(/missing the "id"/);
  });

  it('should ensure trigger has unique primary key', () => {
    const output = {
      input: {
        _zapier: {
          event: {
            method: 'triggers.message.operation.perform',
            command: 'execute',
            bundle: {},
          },
          app: {
            triggers: {
              message: {
                operation: {
                  outputFields: [
                    { key: 'timestamp', primary: true },
                    { key: 'email', primary: true },
                    { key: 'subject' },
                  ],
                },
              },
            },
          },
        },
      },
      results: [
        { timestamp: 1710836598, email: 'joe@example.com', subject: 'hi' },
        { timestamp: 1710836622, email: 'amy@example.com', subject: 'hi' },
        { timestamp: 1710836622, email: 'amy@example.com', subject: 'hey' },
      ],
    };

    (() => {
      checkOutput(output);
    }).should.throw(
      /primary key of `{"timestamp":1710836622,"email":"amy@example.com"}`/,
    );
  });

  it('should be ok if there is a null', () => {
    const output = {
      input: {
        _zapier: {
          event: {
            method: 'triggers.key.operation.perform',
            command: 'execute',
            bundle: {},
          },
        },
      },
      results: { text: 'An item without id', throwForNull: null },
    };

    (() => {
      checkOutput(output);
    }).should.throw(/missing the "id"/);
  });

  it('should allow to skip checks', () => {
    const output = {
      input: {
        _zapier: {
          event: {
            method: 'triggers.key.operation.perform',
            command: 'execute',
            bundle: {
              skipChecks: ['triggerHasId'],
            },
          },
        },
      },
      results: [{ text: 'An item without id' }],
    };

    const newOutput = checkOutput(output);
    newOutput.should.deepEqual(output);
  });
});
