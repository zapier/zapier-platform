'use strict';

require('should');

const findDuplicateFieldKeys = require('../../src/tools/find-duplicate-field-keys');

describe('find-duplicate-field-keys', () => {
  it('should find duplicate keys', () => {
    const fields = [{ key: 'a' }, { key: 'b' }, { key: 'a' }];
    const duplicateKeys = findDuplicateFieldKeys(fields);
    duplicateKeys.should.eql(['a']);
  });

  it('should return empty array when there are no duplicate keys', () => {
    const fields = [{ key: 'a' }, { key: 'b' }, { key: 'c' }];
    const duplicateKeys = findDuplicateFieldKeys(fields);
    duplicateKeys.should.eql([]);
  });
});
