'use strict';

const errors = require('../src/errors');

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
        '{"message":"My Message","code":"MyCode","status":400}'
      );
    });
  });

  describe('ResponseError', () => {
    it('should stringify arguments', async () => {
      const response = {
        status: 400,
        headers: {
          get: () => 'text/html; charset=utf-8'
        },
        content: '',
        request: {
          url: 'https://httpbin.org/status/400'
        }
      };
      const error = new errors.ResponseError(response);

      error.should.instanceOf(errors.ResponseError);
      error.name.should.eql('ResponseError');
      error.message.should.eql(
        '{"status":400,"headers":{"content-type":"text/html; charset=utf-8"},"content":"","request":{"url":"https://httpbin.org/status/400"}}'
      );
    });
  });
});
