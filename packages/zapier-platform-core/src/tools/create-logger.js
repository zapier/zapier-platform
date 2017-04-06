'use strict';

const _ = require('lodash');

const request = require('./request-client-internal');
const cleaner = require('./cleaner');
const dataTools = require('./data');
const hashing = require('./hashing');
const ZapierPromise = require('./promise');

const DEFAULT_LOGGING_HTTP_ENDPOINT = 'https://httplogger.zapier.com/input';
const DEFAULT_LOGGING_HTTP_API_KEY = 'R24hzu86v3jntwtX2DtYECeWAB';

const truncate = (str) => _.truncate(str, {length: 3500, omission: ' [...]'});

// format HTTP request details into string suitable for printing to stdout
const httpDetailsLogMessage = (data) => {
  if (data.log_type !== 'http') {
    return '';
  }

  const trimmedData = _.reduce(data, (result, value, key) => {
    result[key] = value;
    if (typeof value === 'string') {
      result[key] = truncate(value);
    }
    return result;
  }, {});

  if (trimmedData.request_params) {
    trimmedData.request_params = '?' + trimmedData.request_params;
  }

  return `\
${trimmedData.request_method || 'GET'} ${trimmedData.request_url}${trimmedData.request_params || ''}
${trimmedData.request_headers || ''}

${trimmedData.request_data || ''}

${trimmedData.response_status_code || 0}

${trimmedData.response_headers || ''}

${trimmedData.response_content || ''}
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

const makeSensitiveBank = (event) => {
  const bundle = event.bundle || {};
  const sensitiveData = _.extend(
    {},
    bundle.authData || {},
    _.extend(
      {},
      process.env || {}
    )
  );
  return _.values(sensitiveData)
    .reduce((bank, val) => {
      // keeps short values from spamming censor strings in logs, < 6 chars is not a proper secret
      // see https://github.com/zapier/zapier-platform-core/issues/4#issuecomment-277855071
      if (val && String(val).length > 5) {
        bank[val] = hashing.snipify(val);
      }
      return bank;
    }, {});
};

const sendLog = (options, event, message, data) => {
  data = _.extend(
    {},
    data || {},
    event.logExtra || {}
  );
  data.log_type = data.log_type || 'console';

  const sensitiveBank = makeSensitiveBank(event);
  message = truncate(cleaner.recurseReplaceBank(message, sensitiveBank));
  data = cleaner.recurseReplaceBank(data, sensitiveBank);
  data = dataTools.recurseReplace(data, truncate);

  const body = {
    message,
    data,
    token: options.token,
  };

  // TODO: auth data
  const httpOptions = {
    url: options.endpoint,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    timeout: 3000
  };

  if (event.logToStdout) {
    toStdout(event, body.message, data);
  }

  if (options.logBuffer && data.log_type === 'console') {
    // Cap size of messages in log buffer, in case devs log humongous things.
    options.logBuffer.push({type: data.log_type, message: truncate(body.message)});
  }

  if (options.token) {
    return request(httpOptions).catch(err => {
      // Swallow logging errors.
      // This will show up in AWS logs at least:
      console.error('Error making log request:', err, 'http options:', httpOptions);
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
    endpoint: process.env.LOGGING_ENDPOINT || DEFAULT_LOGGING_HTTP_ENDPOINT,
    // TODO: can drop apiKey after https://github.com/zapier/http-to-gelf/pull/1 ships
    apiKey: process.env.LOGGING_API_KEY || DEFAULT_LOGGING_HTTP_API_KEY,
    token: event.token
  });

  return sendLog.bind(undefined, options, event);
};

module.exports = createLogger;
