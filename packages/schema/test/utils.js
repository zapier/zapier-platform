'use strict';

require('should');
const { SKIP_KEY } = require('../lib/constants');

const testInlineSchemaExamples = (name) => {
  const Schema = require('../lib/schemas/' + name);
  const goods = Schema.schema.examples || [];
  const bads = Schema.schema.antiExamples || [];

  describe(name, () => {
    it('valid example schemas should pass validation', function () {
      if (!goods.length) {
        this.skip();
      } else {
        goods
          .filter((t) => !t[SKIP_KEY])
          .forEach((good) => {
            const { errors } = Schema.validate(good);
            errors.should.have.length(0);
          });
      }
    });

    it('invalid example schemas should fail validation', function () {
      if (!bads.length) {
        this.skip();
      } else {
        bads
          .filter((t) => !t[SKIP_KEY])
          .map((t) => t.example)
          .forEach((bad) => {
            const { errors } = Schema.validate(bad);
            if (errors.length === 0) {
              console.log(bad);
            }
            errors.should.not.have.length(0);
          });
      }
    });
  });
};

module.exports = {
  testInlineSchemaExamples,
};
