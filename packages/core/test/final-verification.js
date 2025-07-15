'use strict';

const should = require('should');

describe('Final Feature Verification', () => {
  it('should allow CommonJS destructuring import of errors', () => {
    const { errors } = require('../index');

    should.exist(errors);
    should.exist(errors.RefreshAuthError);
    should.exist(errors.CheckError);
    should.exist(errors.Error);
    should.exist(errors.ThrottledError);
    should.exist(errors.ExpiredAuthError);
    should.exist(errors.HaltedError);

    // Test instantiation of each error type
    const refreshError = new errors.RefreshAuthError('refresh needed');
    const checkError = new errors.CheckError('validation failed');
    const appError = new errors.Error('app error', 'CODE', 500);
    const throttledError = new errors.ThrottledError('rate limited', 60);
    const expiredError = new errors.ExpiredAuthError('token expired');
    const haltedError = new errors.HaltedError('halted');

    refreshError.name.should.eql('RefreshAuthError');
    checkError.name.should.eql('CheckError');
    appError.name.should.eql('AppError');
    throttledError.name.should.eql('ThrottledError');
    expiredError.name.should.eql('ExpiredAuthError');
    haltedError.name.should.eql('HaltedError');
  });

  it('should maintain backward compatibility with z.errors pattern', () => {
    const zapier = require('../index');

    // Test that the old pattern still works through the z object
    should.exist(zapier.errors);
    const error = new zapier.errors.RefreshAuthError('backwards compatible');
    error.name.should.eql('RefreshAuthError');
  });

  it('should provide errors through tools as well', () => {
    const zapier = require('../index');

    should.exist(zapier.tools.errors);
    const error = new zapier.tools.errors.CheckError('via tools');
    error.name.should.eql('CheckError');

    // Verify tools.errors is the same object as the main errors export
    zapier.tools.errors.should.equal(zapier.errors);
  });

  it('should solve the original issue use case', () => {
    // Simulate the original issue: creating a util that needs errors without z object
    const { errors } = require('../index');

    function refreshUtil(authData) {
      if (!authData || !authData.access_token) {
        throw new errors.RefreshAuthError(
          'Missing access token - refresh required',
        );
      }
      return authData;
    }

    function validateUtil(data, field) {
      if (!data || !data[field]) {
        throw new errors.CheckError(`Required field '${field}' is missing`);
      }
    }

    // Test that the utils work without needing z object
    try {
      refreshUtil(null);
      should.fail('Should have thrown RefreshAuthError');
    } catch (err) {
      err.should.instanceOf(errors.RefreshAuthError);
      err.name.should.eql('RefreshAuthError');
    }

    try {
      validateUtil({}, 'required_field');
      should.fail('Should have thrown CheckError');
    } catch (err) {
      err.should.instanceOf(errors.CheckError);
      err.name.should.eql('CheckError');
    }
  });
});
