const debug = require('debug')('zapier:invoke');

/**
 * Custom logger for localAppCommand that logs messages and data using the debug module.
 * @param {string} message - The log message
 * @param {*} data - Additional data to log
 */
const customLogger = (message, data) => {
  debug(message);
  debug(data);
};

module.exports = { customLogger };
