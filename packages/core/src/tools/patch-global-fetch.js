const { ALLOWED_HTTP_DATA_CONTENT_TYPES, getContentType } = require('./http');

const normalizeRequestInfo = (input, init) => {
  if (typeof input === 'string') {
    const headers = init.headers || {};
    const contentType = getContentType(headers);
    const shouldIncludeData = ALLOWED_HTTP_DATA_CONTENT_TYPES.has(contentType);
    return {
      url: input,
      method: init.method || 'GET',
      headers: init.headers || {},
      data: shouldIncludeData ? init.body || '' : '<unsupported format>',
    };
  } else if (input instanceof Request) {
    // TODO: Handle Request object
    return null;
  }
  return null;
};

const patchGlobalFetch = (logger) => {
  if (!global.fetch || global.fetch.patchedByZapier) {
    return;
  }

  const originalFetch = global.fetch;

  global.fetch = async function (input, init) {
    const response = await originalFetch(input, init);
    const requestInfo = normalizeRequestInfo(input, init);
    if (requestInfo) {
      logger(`${response.status} ${requestInfo.method} ${requestInfo.url}`, {
        log_type: 'http',
        request_type: 'patched-devplatform-outbound',
        request_url: requestInfo.url,
        request_method: requestInfo.method,
        request_headers: requestInfo.headers,
        request_data: requestInfo.data,
        request_via_client: false,
        response_status_code: response.status,
        response_headers: Object.fromEntries(response.headers.entries()),
        // response_content: response.body,
      });
    }
    return response;
  };

  global.fetch.patchedByZapier = true;
};

module.exports = patchGlobalFetch;
