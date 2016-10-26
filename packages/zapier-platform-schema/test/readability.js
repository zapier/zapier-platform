'use strict';

require('should');

const AuthenticationSchema = require('../lib/schemas/AuthenticationSchema');


describe('readability', () => {

  it('should have decent messages for anyOf mismatches', () => {
    const results = AuthenticationSchema.validate({
      type: 'oauth2',
      test: 'whateverfake!',
    });
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql('instance.test is not exactly one from </RequestSchema>,</FunctionSchema>');
  });

});
