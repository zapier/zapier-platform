'use strict';

const { Transform } = require('stream');

const _ = require('lodash');

const request = require('./request-client-internal');
const { simpleTruncate, recurseReplace } = require('./data');
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
const { isUrlWithSecrets } = require('@zapier/secret-scrubber/lib/convenience');

// The payload size per request to stream logs. This should be slighly lower
// than the limit (16 MB) on the server side.
const LOG_STREAM_BYTES_LIMIT = 15 * 1024 * 1024;

const isUrl = (url) => {
  try {
    // eslint-disable-next-line no-new
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

const truncate = (str) => simpleTruncate(str, 3500, ' [...]');

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
        result[key] = truncate(value);
      }
      return result;
    },
    {}
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

const buildSensitiveValues = (event, data) => {
  const bundle = event.bundle || {};
  const authData = bundle.authData || {};
  // for the most part, we should censor all the values from authData
  // the exception is safe urls, which should be filtered out - we want those to be logged
  const sensitiveAuthData = recurseExtract(authData, (key, value) => {
    if (isUrl(value) && !isUrlWithSecrets(value)) {
      return false;
    }
    return true;
  });
  return [
    ...sensitiveAuthData,
    ...findSensitiveValues(process.env),
    ...findSensitiveValues(data),
  ];
};

class LogStream extends Transform {
  constructor(options) {
    super(options);

    const httpOptions = {
      url: options.url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-ndjson',
        'X-Token': options.token,
      },
      body: this,
    };

    this.request = request(httpOptions).catch((err) => {
      // Swallow logging errors.
      // This will show up in AWS logs at least:
      console.error(
        'Error making log request:',
        err,
        'http options:',
        httpOptions
      );
    });
  }

  _transform(chunk, encoding, callback) {
    this.push(chunk);
    this.bytesWritten += Buffer.byteLength(chunk, encoding);
    callback();
  }
}

class LogStreamFactory {
  constructor(url, token) {
    this._logStream = null;
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

  async end() {
    if (this._logStream) {
      this._logStream.end();
      const response = await this._logStream.request;
      return response;
    }
  }
}

const logStreamFactory = new LogStreamFactory();

const sendLog = async (options, event, message, data) => {
  data = _.extend({}, data || {}, event.logExtra || {});
  data.log_type = data.log_type || 'console';

  data.request_headers = unheader(data.request_headers);
  data.response_headers = unheader(data.response_headers);

  const sensitiveValues = buildSensitiveValues(event, data);
  // scrub throws an error if there are no secrets
  const safeMessage = truncate(
    sensitiveValues.length ? scrub(message, sensitiveValues) : message
  );
  const safeData = recurseReplace(
    sensitiveValues.length ? scrub(data, sensitiveValues) : data,
    truncate
  );
  const unsafeData = recurseReplace(data, truncate);
  // Keep safe log keys uncensored
  Object.keys(safeData).forEach((key) => {
    if (SAFE_LOG_KEYS.includes(key)) {
      safeData[key] = unsafeData[key];
    }
  });

  safeData.request_headers = formatHeaders(safeData.request_headers);
  safeData.response_headers = formatHeaders(safeData.response_headers);

  if (event.logToStdout) {
    toStdout(event, message, unsafeData);
  }

  if (options.logBuffer && data.log_type === 'console') {
    // Cap size of messages in log buffer, in case devs log humongous things.
    options.logBuffer.push({ type: safeData.log_type, message: safeMessage });
  }

  if (options.token) {
    const logStream = logStreamFactory.getOrCreate(
      options.endpoint,
      options.token
    );
    logStream.write(
      // JSON Lines format: It's important the serialized JSON object itself has
      // no line breaks, and after an object it ends with a line break.
      JSON.stringify({ message: safeMessage, data: safeData }) + '\n'
    );
  }
};

/*
  Creates low level logging function that POSTs to endpoint (GL by default).
  Use internally; do not expose to devs.
*/
const createLogger = (event, options) => {
  options = options || {};
  event = event || {};

  options = _.defaults(options, {
    endpoint: process.env.LOGGING_ENDPOINT || DEFAULT_LOGGING_HTTP_ENDPOINT,
    apiKey: process.env.LOGGING_API_KEY || DEFAULT_LOGGING_HTTP_API_KEY,
    token: process.env.LOGGING_TOKEN || event.token,
  });

  const logger = sendLog.bind(undefined, options, event);

  // Lambda handler must call logger.end() to at the end of a Lambda invocation
  // to close the log stream. Otherwise, it will hang!
  logger.end = async () => {
    return logStreamFactory.end();
  };
  return logger;
};

module.exports = createLogger;
