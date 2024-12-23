const _ = require('lodash');

const { ALLOWED_HTTP_DATA_CONTENT_TYPES } = require('./http');

const stringifyRequestData = (data) => {
  // Be careful not to consume the data if it's a stream
  if (typeof data === 'string') {
    return data;
  } else if (data instanceof URLSearchParams) {
    return data.toString();
  } else if (global.FormData && data instanceof global.FormData) {
    return '<FormData>';
  } else {
    // See https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#setting_a_body
    // for other possible body types
    return '<unsupported format>';
  }
};

const normalizeRequestInfo = (input, init) => {
  const result = {
    method: 'GET',
    headers: {},
    data: '',
  };

  if (global.Request && input instanceof global.Request) {
    result.url = input.url;
    result.method = input.method || result.method;
    result.headers =
      Object.fromEntries(input.headers.entries()) || result.headers;
    if (input.body) {
      result.data = stringifyRequestData(input.body);
    }
  } else if (typeof input.toString === 'function') {
    // This condition includes `typeof input === 'string'` as well
    result.url = input.toString();
  } else {
    // Don't log if we don't recognize the input type
    return null;
  }

  if (init) {
    result.method = init.method || result.method;
    result.headers = init.headers || result.headers;
    if (init.body) {
      result.data = stringifyRequestData(init.body);
    }
  }

  return result;
};

// Is this request made by z.request()?
const isZapierUserAgent = (headers) =>
  _.get(headers, 'user-agent', []).indexOf('Zapier') !== -1;

const shouldIncludeResponseContent = (contentType) => {
  for (const ctype of ALLOWED_HTTP_DATA_CONTENT_TYPES) {
    if (contentType.includes(ctype)) {
      return true;
    }
  }
  return false;
};

const stringifyResponseContent = async (response) => {
  // Be careful not to consume the original response body, which is why we clone it
  return response.clone().text();
};

// Usage:
//   global.fetch = wrapFetchWithLogger(global.fetch, logger);
const wrapFetchWithLogger = (fetchFunc, logger) => {
  if (fetchFunc.patchedByZapier) {
    // Important not to reuse logger between calls, because we always destroy
    // the logger at the end of a Lambda call.
    fetchFunc.zapierLogger = logger;
    return fetchFunc;
  }

  const newFetch = async function (input, init) {
    const response = await fetchFunc(input, init);
    const requestInfo = normalizeRequestInfo(input, init);
    if (requestInfo && !isZapierUserAgent(requestInfo.headers)) {
      const responseContentType = response.headers.get('content-type');

      newFetch.zapierLogger(
        `${response.status} ${requestInfo.method} ${requestInfo.url}`,
        {
          log_type: 'http',
          request_type: 'patched-devplatform-outbound',
          request_url: requestInfo.url,
          request_method: requestInfo.method,
          request_headers: requestInfo.headers,
          request_data: requestInfo.data,
          request_via_client: false,
          response_status_code: response.status,
          response_headers: Object.fromEntries(response.headers.entries()),
          response_content: shouldIncludeResponseContent(responseContentType)
            ? await stringifyResponseContent(response)
            : '<unsupported format>',
        },
      );
    }
    return response;
  };

  newFetch.patchedByZapier = true;
  newFetch.zapierLogger = logger;
  return newFetch;
};

module.exports = wrapFetchWithLogger;
