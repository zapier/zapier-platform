'use strict';

require('should');

const path = require('path');
const schemaTools = require('../../src/tools/schema-tools');

describe('schema-tools', () => {
  describe('makeFunction', () => {
    it('should make a function', () => {
      const func = schemaTools.makeFunction('return [{ id: 1234 }];');
      func().should.deepEqual([{ id: 1234 }]);
    });

    it('should gracefully handle bad code', () => {
      const func = schemaTools.makeFunction('return [{ id: 12');
      func.should.throw(SyntaxError);
    });
  });

  describe('requireOrLazyError', () => {
    it('should require properly', () => {
      const funcPath = path.resolve('test/moduleuserapp/export-func');
      const func = schemaTools.requireOrLazyError(funcPath);
      func().should.deepEqual([{ id: 1234 }]);
    });

    it('should wrap non-function fails', () => {
      const funcPath = path.resolve('test/moduleuserapp/index');
      const func = schemaTools.requireOrLazyError(funcPath);
      func.should.throw(/does not export a function/);
    });

    it('should wrap require fails', () => {
      const func = schemaTools.requireOrLazyError('not/a/real/pathjs');
      func.should.throw(/Cannot find module/);
    });
  });

  describe('findSourceRequireFunctions', () => {
    it('should replace beforeRequest source', () => {
      const appRaw = {
        beforeRequest: [{ source: 'return a - b;', args: ['a', 'b'] }]
      };
      const app = schemaTools.findSourceRequireFunctions(appRaw);
      app.beforeRequest[0](123, 23).should.eql(100);
    });
  });
});
