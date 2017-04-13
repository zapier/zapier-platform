'use strict';

require('should');

const createIsSingle = require('../src/checks/create-is-single');

describe('checks', () => {
  it('createIsSingle sees create return values with multiples', () => {
    createIsSingle.run('some.method', []).length.should.eql(0);
    createIsSingle.run('some.method', [{}]).length.should.eql(0);
    createIsSingle.run('some.method', {}).length.should.eql(0);
    // the only error in this set:
    createIsSingle.run('some.method', [{}, {}]).length.should.eql(1);
  });
});
