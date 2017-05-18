'use strict';

require('should');

const checks = require('../src/checks');

describe('checks', () => {
  it('createIsSingle sees create return values with multiples', () => {
    checks.createIsSingle.run('some.method', []).length.should.eql(0);
    checks.createIsSingle.run('some.method', [{}]).length.should.eql(0);
    checks.createIsSingle.run('some.method', {}).length.should.eql(0);

    checks.createIsSingle.run('some.method', [{}, {}]).length.should.eql(1);
  });

  it('searchIsArray should error for objects', () => {
    checks.searchIsArray.run('some.method', [{}, {}]).length.should.eql(0);
    checks.searchIsArray.run('some.method', {}).length.should.eql(1);
  });
});
