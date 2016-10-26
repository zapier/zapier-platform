'use strict';

require('should');

const ensurePath = require('../../src/tools/ensure-path');

describe('ensure-path', () => {
  it('should ensure full path', () => {
    let obj = {};
    obj = ensurePath(obj, 'nested._object.deeper.and-deeper');
    obj.should.eql({nested: {_object: {deeper: {'and-deeper': {}}}}});
  });
});
