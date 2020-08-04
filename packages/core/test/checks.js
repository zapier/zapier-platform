'use strict';

require('should');

const checks = require('../src/checks');
const checkOutput = require('../src/app-middlewares/after/checks');

const isTrigger = require('../src/checks/is-trigger');
const isSearch = require('../src/checks/is-search');
const isCreate = require('../src/checks/is-create');
const isInputFields = require('../src/checks/is-input-fields');

const testMethod = 'some.method';

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

    isInputFields('triggers.blah.operation.inputFields').should.be.true();
    isInputFields('resources.blah.list.operation.inputFields').should.be.true();
    isInputFields('triggers.blah.operation.perform').should.be.false();
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

describe('inputFieldsHaveUniqueKeys', () => {
  it('should ensure fields do not have duplicate keys', () => {
    const output = {
      input: {
        _zapier: {
          event: {
            method: 'triggers.key.operation.inputFields',
            command: 'execute',
            bundle: {
              skipChecks: ['triggerHasId'],
            },
          },
        },
      },
      results: [{ key: 'a' }, { key: 'b' }, { key: 'a' }],
    };

    (() => {
      checkOutput(output);
    }).should.throw(/Invalid API Response:\n\s+- Duplicate field keys: a/);
  });

  it('should allow fields with no duplicate keys', () => {
    const output = {
      input: {
        _zapier: {
          event: {
            method: 'triggers.key.operation.inputFields',
            command: 'execute',
            bundle: {
              skipChecks: ['triggerHasId'],
            },
          },
        },
      },
      results: [{ key: 'a' }, { key: 'b' }, { key: 'c' }],
    };

    const newOutput = checkOutput(output);
    newOutput.should.deepEqual(output);
  });
});
