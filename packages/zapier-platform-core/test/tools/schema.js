'use strict';

require('should');

const schema = require('../../src/tools/schema');

describe('schema', () => {

  describe('convertResourceDos', () => {
    it('should handle blank methods', () => {
      const appRaw = {
        resources: {
          foo: {
            key: 'foo',
            noun: 'Foo',
            hook: {},
            list: {},
            search: {},
            create: {}
          }
        }
      };
      const obj = schema.convertResourceDos(appRaw);
      obj.should.eql({
        triggers: {},
        creates: {},
        searches: {}
      });
    });
  });
});
