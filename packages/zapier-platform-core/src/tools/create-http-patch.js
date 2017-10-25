const _ = require('lodash');
const constants = require('../constants');

const createHttpPatch = (event) => {
  const createLogger = require('./create-logger');
  const logBuffer = [];
  const logger = createLogger(event, {logBuffer});

  const httpPatch = (object) => {
    const originalRequest = object.request;

    // Avoids multiple patching and memory leaks (mostly when running tests locally)
    if (object.patchedByZapier) {
      return;
    }

    object.patchedByZapier = true;

    // Proxy the request method
    object.request = (options, callback) => {
      const requestUrl = options.url || options.href || (`${options.protocol || 'https://'}${options.host}${options.path}`);
      const logger_url = process.env.LOGGING_ENDPOINT || constants.DEFAULT_LOGGING_HTTP_ENDPOINT;

      // Ignore logger requests
      if (requestUrl.indexOf(logger_url) !== -1) {
        return originalRequest(options, callback);
      }

      // Ignore requests made via the request client
      if (_.get(options.headers, 'user-agent', []).indexOf('Zapier') !== -1) {
        return originalRequest(options, callback);
      }

      // Proxy the callback to get the response
      const newCallback = function(response) {
        const requestHeaders = _.map(Object.keys(options.headers || {}), (header) => `${header}: ${options.headers[header]}`);
        const responseHeaders = _.map(Object.keys(response.headers || {}), (header) => `${header}: ${response.headers[header]}`);
        const responseBody = [];

        const logResponse = () => {
          // Prepare data for GL
          const logData = {
            log_type: 'http',
            request_type: 'devplatform-outbound',
            request_url: requestUrl,
            request_method: options.method || 'GET',
            request_headers: requestHeaders.join('\n'),
            request_data: options.body || '',
            request_via_client: false,
            response_status_code: response.statusCode,
            response_headers: responseHeaders.join('\n'),
            response_content: responseBody.join(''),
          };

          logger(`${logData.response_status_code} ${logData.request_method} ${logData.request_url}`, logData);
        };

        response.on('data', (chunk) => responseBody.push(chunk.toString()));
        response.on('end', logResponse);
        response.on('error', logResponse);

        // If there was a callback, call it now
        if (_.isFunction(callback)) {
          callback.apply(this, arguments);
        }
      };

      return originalRequest(options, newCallback);
    };
  };

  return httpPatch;
};

module.exports = createHttpPatch;
