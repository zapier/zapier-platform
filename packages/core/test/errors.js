'use strict';

const should = require('should');
const errors = require('../src/errors');
const { HTTPBIN_URL } = require('./constants');

describe('errors', () => {
  it('should name errors', () => {
    const error = new errors.CheckError('Check Mate!');

    error.should.instanceOf(errors.CheckError);
    error.name.should.eql('CheckError');
    error.message.should.eql('Check Mate!');
  });

  describe('AppError', () => {
    it('should stringify arguments', () => {
      const error = new errors.Error('My Message', 'MyCode', 400);

      error.should.instanceOf(errors.Error);
      error.name.should.eql('AppError');
      error.message.should.eql(
        '{"message":"My Message","code":"MyCode","status":400}',
      );
    });
  });

  describe('ResponseError', () => {
    it('should stringify arguments', async () => {
      const response = {
        status: 400,
        headers: {
          get: (header) => {
            switch (header) {
              case 'retry-after':
                return 60;
              default:
                return 'text/html; charset=utf-8';
            }
          },
        },
        content: '',
        request: {
          url: `${HTTPBIN_URL}/status/400`,
        },
      };
      const error = new errors.ResponseError(response);

      error.should.instanceOf(errors.ResponseError);
      error.name.should.eql('ResponseError');
      error.message.should.eql(
        `{"status":400,"headers":{"content-type":"text/html; charset=utf-8","retry-after":60},"content":"","request":{"url":"${HTTPBIN_URL}/status/400"}}`,
      );
    });

    it('should work with stream request', async () => {
      const response = {
        status: 401,
        headers: {
          get: (header) => {
            switch (header) {
              case 'retry-after':
                return 60;
              default:
                return 'application/json';
            }
          },
        },
        request: {
          url: 'https://example.com',
        },
      };
      Object.defineProperty(response, 'content', {
        get: function () {
          throw new Error('stream request does not have content');
        },
      });

      const error = new errors.ResponseError(response);

      error.should.instanceOf(errors.ResponseError);
      error.name.should.eql('ResponseError');
      error.message.should.eql(
        `{"status":401,"headers":{"content-type":"application/json","retry-after":60},"content":null,"request":{"url":"https://example.com"}}`,
      );
    });
  });

  describe('Package exports', () => {
    it('should export errors from main package', () => {
      const zapierPlatformCore = require('../index');

      // Check that errors are exported at package level
      zapierPlatformCore.should.have.property('errors');
      should.exist(zapierPlatformCore.errors);

      // Check that specific error types are available
      zapierPlatformCore.errors.should.have.property('RefreshAuthError');
      zapierPlatformCore.errors.should.have.property('CheckError');
      zapierPlatformCore.errors.should.have.property('Error');

      // Test that we can instantiate them
      const refreshError = new zapierPlatformCore.errors.RefreshAuthError(
        'test message',
      );
      refreshError.should.instanceOf(
        zapierPlatformCore.errors.RefreshAuthError,
      );
      refreshError.name.should.eql('RefreshAuthError');
      refreshError.message.should.eql('test message');
    });

    it('should export errors from tools', () => {
      const zapierPlatformCore = require('../index');

      // Check that errors are also available through tools
      zapierPlatformCore.should.have.property('tools');
      zapierPlatformCore.tools.should.have.property('errors');
      should.exist(zapierPlatformCore.tools.errors);

      // Verify it's the same errors object
      zapierPlatformCore.tools.errors.should.eql(zapierPlatformCore.errors);
    });
  });
});
