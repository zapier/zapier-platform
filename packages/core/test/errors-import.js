'use strict';

const should = require('should');

describe('errors import', () => {
  it('should allow importing errors from zapier-platform-core', () => {
    // Test the exact pattern requested in the issue
    const { errors } = require('../index');

    should.exist(errors);
    errors.should.have.property('RefreshAuthError');

    // Test that we can use it as requested
    const error = new errors.RefreshAuthError('test auth refresh error');
    error.should.instanceOf(errors.RefreshAuthError);
    error.name.should.eql('RefreshAuthError');
    error.message.should.eql('test auth refresh error');
  });

  it('should allow importing specific error types', () => {
    // Test destructuring of specific error types
    const { errors } = require('../index');
    const { RefreshAuthError, CheckError, Error: AppError } = errors;

    should.exist(RefreshAuthError);
    should.exist(CheckError);
    should.exist(AppError);

    // Test instantiation
    const refreshError = new RefreshAuthError('refresh failed');
    const checkError = new CheckError('check failed');
    const appError = new AppError('app error', 'CODE', 500);

    refreshError.name.should.eql('RefreshAuthError');
    checkError.name.should.eql('CheckError');
    appError.name.should.eql('AppError');
  });
});
