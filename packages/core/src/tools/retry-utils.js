'use strict';

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - The function to retry
 * @param {number} retries - Maximum number of retries (default: 3)
 * @param {number} delay - Initial delay in milliseconds (default: 100)
 * @param {number} attempt - Current attempt number (internal use)
 * @returns {Promise} The result of the function call
 */
const withRetry = async (fn, retries = 3, delay = 100, attempt = 0) => {
  try {
    return await fn();
  } catch (error) {
    if (attempt >= retries) {
      // Create an enhanced error with retry information
      const retryError = new Error(
        `Request failed after ${retries + 1} attempts. ` +
          `Last error: ${error.message}.`,
      );

      throw retryError;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    return withRetry(fn, retries, delay, attempt + 1);
  }
};

module.exports = {
  withRetry,
};
