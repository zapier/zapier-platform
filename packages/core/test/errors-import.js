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

  it('should allow importing specific error types from errors object', () => {
    // Test destructuring of specific error types from the errors object
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

  it('should not export individual error classes directly', () => {
    // Test that individual error classes are NOT available as direct exports
    // This destructuring should result in undefined values
    const {
      RefreshAuthError,
      CheckError,
      ExpiredAuthError,
    } = require('../index');

    // These should all be undefined since we only export the errors object
    should.not.exist(RefreshAuthError);
    should.not.exist(CheckError);
    should.not.exist(ExpiredAuthError);
  });

  it('should contain all expected error classes in errors object', () => {
    // Test that all error classes are available through the errors object
    const { errors } = require('../index');

    const expectedErrorClasses = [
      'CheckError',
      'DehydrateError',
      'ExpiredAuthError',
      'HaltedError',
      'MethodDoesNotExist',
      'NotImplementedError',
      'RefreshAuthError',
      'RequireModuleError',
      'StashedBundleError',
      'StopRequestError',
      'ResponseError',
      'ThrottledError',
      'Error', // This is AppError but exported as Error
    ];

    expectedErrorClasses.forEach((errorClassName) => {
      should.exist(errors[errorClassName]);
      errors[errorClassName].should.be.a('function');

      // Test that we can instantiate each error
      const instance = new errors[errorClassName]('test message');
      instance.should.be.instanceOf(Error);
      instance.message.should.match(/test message/);
    });
  });
});
