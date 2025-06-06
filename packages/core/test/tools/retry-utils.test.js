'use strict';

const should = require('should');
const { withRetry } = require('../../src/tools/retry-utils');

// Helper function to create a function that fails a specific number of times
const createFailingFunction = (failCount) => {
  let attempts = 0;
  return async () => {
    attempts++;
    if (attempts <= failCount) {
      throw new Error('failure');
    }
    return 'success';
  };
};

describe('retry-utils', () => {
  describe('withRetry', () => {
    it('should return the result when function succeeds on first try', async () => {
      const successFn = async () => 'success';
      const result = await withRetry(successFn);
      result.should.equal('success');
    });

    it('should retry and eventually succeed', async () => {
      let attempts = 0;
      const eventualSuccessFn = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('temporary failure');
        }
        return 'success after retries';
      };

      const result = await withRetry(eventualSuccessFn);
      result.should.equal('success after retries');
      attempts.should.equal(3);
    });

    it('should throw error after maximum retries', async () => {
      const alwaysFailFn = async () => {
        throw new Error('persistent failure');
      };

      try {
        await withRetry(alwaysFailFn, 2);
        should.fail('Expected withRetry to throw an error');
      } catch (error) {
        error.message.should.match(/Request failed after 3 attempts/);
        error.message.should.match(/Last error: persistent failure/);
      }
    });

    it('should use custom retry count', async () => {
      const customRetryFn = createFailingFunction(3);

      await withRetry(customRetryFn, 2).should.be.rejectedWith(
        /Request failed after 3 attempts\. Last error: failure\./,
      );
    });

    it('should use custom delay', async () => {
      const startTime = Date.now();
      const failingFn = createFailingFunction(3);

      await withRetry(failingFn, 2, 50).should.be.rejectedWith(
        /Request failed after 3 attempts\. Last error: failure\./,
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should have waited at least for the delays (50ms * 2 retries = 100ms)
      // Adding some buffer for test execution time
      totalTime.should.be.greaterThan(90);
    });

    it('should handle async functions that resolve', async () => {
      const asyncFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'async result';
      };

      const result = await withRetry(asyncFn);
      result.should.equal('async result');
    });

    it('should handle functions that return promises', async () => {
      const promiseFn = () => Promise.resolve('promise result');
      const result = await withRetry(promiseFn);
      result.should.equal('promise result');
    });
  });
});
