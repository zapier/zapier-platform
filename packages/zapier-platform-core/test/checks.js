'use strict';

require('should');

const checks = require('../src/checks');

const isTrigger = require('../src/checks/is-trigger');
const isSearch = require('../src/checks/is-search');
const isCreate = require('../src/checks/is-create');

const testMethod = 'some.method';

describe('checks', () => {
  it('should see create return values with multiples via createIsSingle', () => {
    checks.createIsSingle.run(testMethod, []).length.should.eql(0);
    checks.createIsSingle.run(testMethod, [{}]).length.should.eql(0);
    checks.createIsSingle.run(testMethod, {}).length.should.eql(0);

    checks.createIsSingle.run(testMethod, [{}, {}]).length.should.eql(1);
  });

  it('should error for objects via searchIsArray', () => {
    checks.searchIsArray.run(testMethod, [{}, {}]).length.should.eql(0);
    checks.searchIsArray.run(testMethod, [{}]).length.should.eql(0);
    checks.searchIsArray.run(testMethod, {}).length.should.eql(1);
  });

  it('should check for ids via triggerHasId', () => {
    checks.triggerHasId.run(testMethod, [{id: 1}]).length.should.eql(0);
    checks.triggerHasId.run(testMethod, [{id: 1}, {id: 2}]).length.should.eql(0);
    checks.triggerHasId.run(testMethod, [{game_id: 1}]).length.should.eql(1);
    checks.triggerHasId.run(testMethod, []).length.should.eql(0, 'blank array');
  });

  it('should check for unique ids via triggerHasUniqueIds', () => {
    checks.triggerHasUniqueIds.run(testMethod, [{ id: 1 }, { id: 2 }]).length.should.eql(0);
    checks.triggerHasUniqueIds.run(testMethod, [{ id: 1 }, { id: 1 }]).length.should.eql(1);

    checks.triggerHasUniqueIds.run(testMethod, []).length.should.eql(0);
  });

  it('should error for objects via triggerIsArray', () => {
    checks.triggerIsArray.run(testMethod, [{}, {}]).length.should.eql(0);
    checks.triggerIsArray.run(testMethod, []).length.should.eql(0);
    checks.triggerIsArray.run(testMethod, {}).length.should.eql(1);
  });

  it('should error for non-objects via triggerIsObject', () => {
    checks.triggerIsObject.run(testMethod, ['']).length.should.eql(1, 'empty string');
    checks.triggerIsObject.run(testMethod, []).length.should.eql(0, 'empty array');
    checks.triggerIsObject.run(testMethod, [{}, {}]).length.should.eql(0, 'single object');
    checks.triggerIsObject.run(testMethod, [{}, []]).length.should.eql(1, 'mismatched objects');
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
  });
});
