'use strict';

const _ = require('lodash');

const request = require('./request-client-internal');
const cleaner = require('./cleaner');
const dataTools = require('./data');
const hashing = require('./hashing');
const ZapierPromise = require('./promise');
const constants = require('../constants');
const { unheader } = require('./http');

const truncate = (str) => dataTools.simpleTruncate(str, 3500, ' [...]');

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

const makeSensitiveBank = (event, data) => {
  const bundle = event.bundle || {};
  const sensitiveValues = _.values(
    _.extend({}, bundle.authData || {}, _.extend({}, process.env || {}))
  );

  const matcher = (key, value) => {
    if (_.isString(value)) {
      const lowerKey = key.toLowerCase();
      return _.some(constants.SENSITIVE_KEYS, (k) => lowerKey.indexOf(k) >= 0);
    }
    return false;
  };

  dataTools.recurseExtract(data, matcher).forEach((value) => {
    sensitiveValues.push(value);
  });

  return _.reduce(
    sensitiveValues,
    (bank, val) => {
      // keeps short values from spamming censor strings in logs, < 6 chars is not a proper secret
      // see https://github.com/zapier/zapier-platform-core/issues/4#issuecomment-277855071
      if (val && String(val).length > 5) {
        const censored = hashing.snipify(val);
        bank[val] = censored;
        bank[encodeURIComponent(val)] = censored;
        try {
          bank[Buffer.from(String(val)).toString('base64')] = censored;
        } catch (e) {
          if (e.name !== 'TypeError') {
            throw e;
          }
          // ignore; Buffer is semi-selective about what types it takes
        }
      }
      return bank;
    },
    {}
  );
};

const sendLog = (options, event, message, data) => {
  data = _.extend({}, data || {}, event.logExtra || {});
  data.log_type = data.log_type || 'console';

  data.request_headers = unheader(data.request_headers);
  data.response_headers = unheader(data.response_headers);

  const sensitiveBank = makeSensitiveBank(event, data);
  const safeMessage = truncate(
    cleaner.recurseReplaceBank(message, sensitiveBank)
  );
  const safeData = dataTools.recurseReplace(
    cleaner.recurseReplaceBank(data, sensitiveBank),
    truncate
  );
  const unsafeData = dataTools.recurseReplace(data, truncate);

  // Keep safe log keys uncensored
  Object.keys(safeData).forEach((key) => {
    if (constants.SAFE_LOG_KEYS.indexOf(key) !== -1) {
      safeData[key] = unsafeData[key];
    }
  });

  safeData.request_headers = formatHeaders(safeData.request_headers);
  safeData.response_headers = formatHeaders(safeData.response_headers);

  const body = {
    message: safeMessage,
    data: safeData,
    token: options.token,
  };

  const httpOptions = {
    url: options.endpoint,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    timeout: 3000,
  };

  if (event.logToStdout) {
    toStdout(event, message, unsafeData);
  }

  if (options.logBuffer && data.log_type === 'console') {
    // Cap size of messages in log buffer, in case devs log humongous things.
    options.logBuffer.push({ type: safeData.log_type, message: safeMessage });
  }

  if (options.token) {
    return request(httpOptions).catch((err) => {
      // Swallow logging errors.
      // This will show up in AWS logs at least:
      console.error(
        'Error making log request:',
        err,
        'http options:',
        httpOptions
      );
    });
  } else {
    return ZapierPromise.resolve();
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
    endpoint:
      process.env.LOGGING_ENDPOINT || constants.DEFAULT_LOGGING_HTTP_ENDPOINT,
    apiKey:
      process.env.LOGGING_API_KEY || constants.DEFAULT_LOGGING_HTTP_API_KEY,
    token: process.env.LOGGING_TOKEN || event.token,
  });

  return sendLog.bind(undefined, options, event);
};

module.exports = createLogger;
