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

  it('should check for unique ids via triggerHasUniqueIds', () => {
    checks.triggerHasUniqueIds
      .run(testMethod, [{ id: 1 }, { id: 2 }])
      .length.should.eql(0);
    checks.triggerHasUniqueIds
      .run(testMethod, [{ id: 1 }, { id: 1 }])
      .length.should.eql(1);

    checks.triggerHasUniqueIds.run(testMethod, []).length.should.eql(0);
    checks.triggerHasUniqueIds
      .run(testMethod, { throwsIfNull: null })
      .length.should.eql(0);
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
