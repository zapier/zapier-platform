'use strict';

const { promisify } = require('util');
const { Transform } = require('stream');
const { parse: querystringParse } = require('querystring');

const _ = require('lodash');
const { AbortController } = require('node-abort-controller');

const request = require('./request-client-internal');
const { simpleTruncate, recurseReplace, truncateData } = require('./data');
const {
  DEFAULT_LOGGING_HTTP_API_KEY,
  DEFAULT_LOGGING_HTTP_ENDPOINT,
  SAFE_LOG_KEYS,
} = require('../constants');
const { unheader } = require('./http');
const {
  scrub,
  findSensitiveValues,
  recurseExtract,
} = require('@zapier/secret-scrubber');
// not really a public function, but it came from here originally
const {
  isUrlWithSecrets,
  isSensitiveKey,
} = require('@zapier/secret-scrubber/lib/convenience');

// The payload size per request to stream logs. This should be slighly lower
// than the limit (16 MB) on the server side.
const LOG_STREAM_BYTES_LIMIT = 15 * 1024 * 1024;

const DEFAULT_LOGGER_TIMEOUT = 200;

const sleep = promisify(setTimeout);

const isUrl = (url) => {
  try {
    // eslint-disable-next-line no-new
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

const MAX_LENGTH = 3500;
const truncateString = (str) => simpleTruncate(str, MAX_LENGTH, ' [...]');

const formatHeaders = (headers = {}) => {
  if (_.isEmpty(headers)) {
    return undefined;
  }
  if (_.isString(headers)) {
    // we had a bug where headers coming in as strings weren't getting censored. If something calls this with stringified headers, we'll bow out. Pass the raw object instead.
    return 'ERR - refusing to log possibly uncensored headers';
  }

  return Object.entries(unheader(headers))
    .map(([header, value]) => {
      return `${header}: ${value}`;
    })
    .join('\n');
};

const maybeStringify = (d) => {
  if (_.isPlainObject(d) || Array.isArray(d)) {
    return JSON.stringify(d);
  }
  return d;
};

// format HTTP request details into string suitable for printing to stdout
const httpDetailsLogMessage = (data) => {
  if (data.log_type !== 'http') {
    return '';
  }

  const trimmedData = _.reduce(
    data,
    (result, value, key) => {
      result[key] = value;
      if (typeof value === 'string') {
        result[key] = truncateString(value);
      }
      return result;
    },
    {},
  );

  if (trimmedData.request_params) {
    trimmedData.request_params = '?' + trimmedData.request_params;
  }

  return `\
${trimmedData.request_method || 'GET'} ${trimmedData.request_url}${
    trimmedData.request_params || ''
  }
${formatHeaders(trimmedData.request_headers) || ''}

${maybeStringify(trimmedData.request_data) || ''}

${trimmedData.response_status_code || 0}

${formatHeaders(trimmedData.response_headers) || ''}

${maybeStringify(trimmedData.response_content) || ''}
`.trim();
};

const toStdout = (event, msg, data) => {
  if (data.log_type === 'http' && event.detailedLogToStdout) {
    const extra = httpDetailsLogMessage(data);
    if (extra) {
      console.log(extra);
    }
  } else {
    console.log(String(msg).replace(/\n$/, ''));
  }
};

// try to parse json; if successful, find secrets in it
const attemptFindSecretsInStr = (s, isGettingNewSecret) => {
  let parsedRespContent;
  try {
    parsedRespContent = JSON.parse(s) || {};
  } catch {
    return [];
  }

  if (isGettingNewSecret && typeof parsedRespContent === 'string') {
    // Likely the response content itself is a secret
    return [parsedRespContent];
  }

  return findSensitiveValues(parsedRespContent);
};

const buildSensitiveValues = (event, data) => {
  const bundle = event.bundle || {};
  const authData = bundle.authData || {};
  // for the most part, we should censor all the values from authData
  // the exception is safe urls, which should be filtered out - we want those to be logged
  // but, we _should_ censor-no-matter-what sensitive keys, even if their value is a safe url
  // this covers the case where someone's password is a valid url ¯\_(ツ)_/¯
  const sensitiveAuthData = recurseExtract(authData, (key, value) => {
    if (isSensitiveKey(key)) {
      return true;
    }

    if (isUrl(value) && !isUrlWithSecrets(value)) {
      return false;
    }
    return true;
  });

  const result = [
    ...sensitiveAuthData,
    ...findSensitiveValues(process.env),
    ...findSensitiveValues(data),
  ];

  // for our http logs (genrated by prepareRequestLog), make sure that we try to parse the content to find any new strings
  // (such as what comes back in the response during an auth refresh)

  const isGettingNewSecret =
    event.method &&
    (event.method.endsWith('refreshAccessToken') ||
      event.method.endsWith('sessionConfig.perform') ||
      event.method.endsWith('oauth1Config.getAccessToken'));

  for (const prop of ['response_content', 'request_data']) {
    if (data[prop]) {
      result.push(...attemptFindSecretsInStr(data[prop], isGettingNewSecret));
    }
  }
  if (data.request_params) {
    result.push(...findSensitiveValues(querystringParse(data.request_params)));
  }
  // unique- no point in duplicates
  return [...new Set(result)];
};

class LogStream extends Transform {
  constructor(options) {
    super(options);
    this.bytesWritten = 0;
    this.controller = new AbortController();
    this.request = this._newRequest(options.url, options.token);
  }

  _newRequest(url, token) {
    const httpOptions = {
      url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-ndjson',
        'X-Token': token,
      },
      body: this,
      signal: this.controller.signal,
    };
    return request(httpOptions).catch((err) => {
      if (err.name === 'AbortError') {
        return {
          status: 200,
          content: 'aborted',
        };
      }

      // Swallow logging errors. This will show up in AWS logs at least.
      // Don't need to log for AbortError because that happens when we abort
      // on purpose.
      console.error('Error making log request:', err);
    });
  }

  _transform(chunk, encoding, callback) {
    this.push(chunk);
    this.bytesWritten += Buffer.byteLength(chunk, encoding);
    callback();
  }

  abort() {
    this.controller.abort();
  }
}

// Implements singleton for LogStream. The goal is for every sendLog() call we
// reuse the same request until the request body grows too big and exceeds
// LOG_STREAM_BYTES_LIMIT.
class LogStreamFactory {
  constructor() {
    this._logStream = null;
    this.ended = false;
  }

  getOrCreate(url, token) {
    if (this._logStream) {
      if (this._logStream.bytesWritten < LOG_STREAM_BYTES_LIMIT) {
        // Reuse the same request for efficiency
        return this._logStream;
      }

      // End this one before creating another
      this._logStream.end();
    }

    this._logStream = new LogStream({ url, token });
    return this._logStream;
  }

  // Ends the logger and gets a response from the log server. Optionally takes
  // timeoutToAbort to specify how many milliseconds we want to wait before
  // force aborting the connection to the log server.
  async end(timeoutToAbort = DEFAULT_LOGGER_TIMEOUT) {
    // Mark the factory as ended. This suggests that any logStream.write() that
    // follows should end() right away.
    this.ended = true;
    let response;

    if (this._logStream) {
      this._logStream.end();

      const clock =
        timeoutToAbort > 0 ? sleep(timeoutToAbort) : Promise.resolve(undefined);
      const responsePromise = this._logStream.request;

      const result = await Promise.race([clock, responsePromise]);
      const isTimeout = !result;
      if (isTimeout) {
        this._logStream.abort();
        // Expect to get a `{content: 'aborted'}` response
        response = await responsePromise;
      } else {
        response = result;
      }

      this._logStream = null;
    }
    return response;
  }
}

const sendLog = async (logStreamFactory, options, event, message, data) => {
  data = _.extend({}, data || {}, event.logExtra || {});
  data.log_type = data.log_type || 'console';

  data.request_headers = unheader(data.request_headers);
  data.response_headers = unheader(data.response_headers);

  const sensitiveValues = buildSensitiveValues(event, data);

  // data.input and data.output have the ability to grow unbounded; the following caps the size to a reasonable amount
  if (data.log_type === 'bundle') {
    data.input = truncateData(data.input, MAX_LENGTH);
    data.output = truncateData(data.output, MAX_LENGTH);
  }

  // scrub throws an error if there are no secrets
  let safeMessage, safeData;
  if (sensitiveValues.length) {
    safeMessage = scrub(message, sensitiveValues);
    safeData = scrub(data, sensitiveValues);
  } else {
    safeMessage = message;
    safeData = data;
  }

  let safeKeyData = _.pick(data, SAFE_LOG_KEYS);

  if (event.logFieldMaxLength != null && event.logFieldMaxLength >= 0) {
    const truncate = (s) =>
      simpleTruncate(s, event.logFieldMaxLength, ' [...]');

    safeMessage = truncate(safeMessage);
    safeData = recurseReplace(safeData, truncate);
    safeKeyData = recurseReplace(safeKeyData, truncate);
  }

  // Keep safe log keys uncensored
  Object.entries(safeKeyData).forEach(([key, value]) => {
    safeData[key] = value;
  });

  safeData.request_headers = formatHeaders(safeData.request_headers);
  safeData.response_headers = formatHeaders(safeData.response_headers);

  if (event.logToStdout) {
    toStdout(event, message, safeData);
  }

  if (event.customLogger && typeof event.customLogger === 'function') {
    // For `zapier invoke` command
    event.customLogger(safeMessage, safeData);
  }

  if (options.logBuffer && data.log_type === 'console') {
    // Cap size of messages in log buffer, in case devs log humongous things.
    options.logBuffer.push({ type: safeData.log_type, message: safeMessage });
  }

  if (options.token) {
    const logStream = logStreamFactory.getOrCreate(
      options.endpoint,
      options.token,
    );
    logStream.write(
      // JSON Lines format: It's important the serialized JSON object itself has
      // no line breaks, and after an object it ends with a line break.
      JSON.stringify({ message: safeMessage, data: safeData }) + '\n',
    );

    if (logStreamFactory.ended) {
      // Lambda handler calls logger.end() at the end. But what if there's a
      // (bad) callback that is still running after the Lambda handler returns?
      // We need to make sure the bad callback ends the logger as well.
      // Otherwise, it will hang!
      logStreamFactory.end(DEFAULT_LOGGER_TIMEOUT);
    }
  }
};

/*
  Creates low level logging function that POSTs to endpoint (GL by default).
  Use internally; do not expose to devs.

  Usage:

    const logger = createLogger(event, options);

    // These will reuse the same request to the log server
    logger('log message here', { log_type: 'console' });
    logger('another log', { log_type: 'console' });
    logger('200 GET https://example.com', { log_type: 'http' });

    // After an invocation, the Lambda handler MUST call logger.end() to close
    // the log stream. Otherwise, it will hang!
    logger.end().finally(() => {
      // anything else you want to do to finish an invocation
    });
*/
const createLogger = (event, options) => {
  options = options || {};
  event = event || {};

  options = _.defaults(options, {
    endpoint: process.env.LOGGING_ENDPOINT || DEFAULT_LOGGING_HTTP_ENDPOINT,
    apiKey: process.env.LOGGING_API_KEY || DEFAULT_LOGGING_HTTP_API_KEY,
    token: process.env.LOGGING_TOKEN || event.token,
  });

  const logStreamFactory = new LogStreamFactory();
  const logger = sendLog.bind(undefined, logStreamFactory, options, event);

  logger.end = async (timeoutToAbort = DEFAULT_LOGGER_TIMEOUT) => {
    return logStreamFactory.end(timeoutToAbort);
  };
  return logger;
};

module.exports = createLogger;
