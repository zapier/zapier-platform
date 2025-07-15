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

  it('should allow importing individual error classes directly', () => {
    // Test direct import of individual error classes (requested by @FokkeZB)
    const { ExpiredAuthError, RefreshAuthError, AppError, CheckError } = require('../index');

    should.exist(ExpiredAuthError);
    should.exist(RefreshAuthError);
    should.exist(AppError);
    should.exist(CheckError);

    // Test instantiation
    const expiredError = new ExpiredAuthError('expired auth');
    const refreshError = new RefreshAuthError('refresh auth');
    const appError = new AppError('app error', 'CODE', 500);
    const checkError = new CheckError('check error');

    expiredError.name.should.eql('ExpiredAuthError');
    refreshError.name.should.eql('RefreshAuthError');
    appError.name.should.eql('AppError');
    checkError.name.should.eql('CheckError');
  });

  it('should export all available error classes individually', () => {
    // Test that all error classes are available as individual exports
    const {
      CheckError,
      DehydrateError,
      ExpiredAuthError,
      HaltedError,
      MethodDoesNotExist,
      NotImplementedError,
      RefreshAuthError,
      RequireModuleError,
      StashedBundleError,
      StopRequestError,
      ResponseError,
      ThrottledError,
      AppError,
    } = require('../index');

    const errorClasses = [
      CheckError,
      DehydrateError,
      ExpiredAuthError,
      HaltedError,
      MethodDoesNotExist,
      NotImplementedError,
      RefreshAuthError,
      RequireModuleError,
      StashedBundleError,
      StopRequestError,
      ResponseError,
      ThrottledError,
      AppError,
    ];

    errorClasses.forEach((ErrorClass, index) => {
      should.exist(ErrorClass);
      ErrorClass.should.be.a('function');
      
      // Test that we can instantiate each error
      const instance = new ErrorClass('test message');
      instance.should.be.instanceOf(Error);
      instance.message.should.match(/test message/);
    });
  });
});
