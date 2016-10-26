'use strict';

require('should');

const testInlineSchemaExamples = (name) => {
  const Schema = require('../lib/schemas/' + name);
  const goods = Schema.schema.examples || [];
  const bads = Schema.schema.antiExamples || [];

  describe(name, () => {

    it('valid example schemas should pass validation', function() {
      if (!goods.length) {
        this.skip();
      } else {
        goods.forEach((good) => {
          const errors = Schema.validate(good).errors;
          errors.should.have.length(0);
        });
      }
    });

    it('invalid example schemas should fail validation', function() {
      if (!bads.length) {
        this.skip();
      } else {
        bads.forEach((bad) => {
          const errors = Schema.validate(bad).errors;
          errors.should.not.have.length(0);
        });
      }
    });
  });
};

module.exports = {
  testInlineSchemaExamples: testInlineSchemaExamples
};
