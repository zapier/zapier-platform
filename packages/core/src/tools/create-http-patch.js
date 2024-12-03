const zlib = require('zlib');
const _ = require('lodash');

const { ALLOWED_HTTP_DATA_CONTENT_TYPES, getContentType } = require('./http');

const constants = require('../constants');

const createHttpPatch = (event) => {
  const httpPatch = (object, logger) => {
    const originalRequest = object.request;

    // Important not to reuse logger between calls, because we always destroy
    // the logger at the end of a Lambda call.
    object.zapierLogger = logger;

    // Avoids multiple patching and memory leaks (mostly when running tests locally)
    if (object.patchedByZapier) {
      return;
    }

    object.patchedByZapier = true;

    // Proxy the request method
    object.request = (options, callback) => {
      // `options` can be an object or a string. If options is a string, it is
      // automatically parsed with url.parse().
      // See https://nodejs.org/docs/latest-v14.x/api/http.html#http_http_request_options_callback
      let requestUrl;
      if (typeof options === 'string') {
        requestUrl = options;
      } else if (typeof options.url === 'string') {
        // XXX: Somehow options.url is available for some requests although
        // http.request doesn't really accept it. Without this else-if, many
        // HTTP requests don't work. Should take a deeper look at this
        // weirdness.
        requestUrl = options.url;
      } else {
        requestUrl =
          options.href ||
          `${options.protocol || 'https:'}//${options.host}${options.path}`;
      }

      const loggerUrl =
        process.env.LOGGING_ENDPOINT || constants.DEFAULT_LOGGING_HTTP_ENDPOINT;

      // Ignore logger requests
      if (requestUrl.indexOf(loggerUrl) !== -1) {
        return originalRequest(options, callback);
      }

      // Ignore requests made via the request client (z.request)
      if (_.get(options.headers, 'user-agent', []).indexOf('Zapier') !== -1) {
        return originalRequest(options, callback);
      }

      // Proxy the callback to get the response
      const newCallback = function (response) {
        const chunks = [];

        // Only include request or response data for specific content types
        // which we are able to read in logs and which are not typically too large
        const requestContentType = getContentType(options.headers || {});
        const responseContentType = getContentType(response.headers || {});

        const shouldIncludeRequestData =
          ALLOWED_HTTP_DATA_CONTENT_TYPES.has(requestContentType);
        const shouldIncludeResponseData =
          ALLOWED_HTTP_DATA_CONTENT_TYPES.has(responseContentType);

        const sendToLogger = (responseBody) => {
          // Prepare data for GL
          const logData = {
            log_type: 'http',
            // Using a custom request_type to differentiate from z.request() since `request_via_client` is not logged in GL
            request_type: 'patched-devplatform-outbound',
            request_url: requestUrl,
            request_method: options.method || 'GET',
            request_headers: options.headers,
            request_data: shouldIncludeRequestData
              ? options.body || ''
              : '<unsupported format>',
            request_via_client: false,
            response_status_code: response.statusCode,
            response_headers: response.headers,
            response_content: shouldIncludeResponseData
              ? responseBody
              : '<unsupported format>',
          };

          object.zapierLogger(
            `${logData.response_status_code} ${logData.request_method} ${logData.request_url}`,
            logData,
          );
        };

        const logResponse = () => {
          // Decode gzip if needed
          if (response.headers['content-encoding'] === 'gzip') {
            const buffer = Buffer.concat(chunks);
            zlib.gunzip(buffer, (err, decoded) => {
              const responseBody = err
                ? 'Could not decode response body.'
                : decoded.toString();

              sendToLogger(responseBody);
            });
          } else {
            const responseBody = _.map(chunks, (chunk) =>
              chunk.toString(),
            ).join('\n');
            sendToLogger(responseBody);
          }
        };

        const originalEmit = response.emit;

        response.emit = function (event, ...args) {
          if (event === 'data') {
            chunks.push(args[0]);
          }
          return originalEmit.apply(this, [event, ...args]);
        };
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
