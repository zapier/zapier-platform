'use strict';

const prepHeaders = headers => {
  headers = headers || {};

  if (headers && typeof headers.forEach === 'function') {
    const _headers = {};
    headers.forEach((value, name) => {
      _headers[name] = value;
    });
    headers = _headers;
  }

  return Object.keys(headers).map(k => {
    const v = headers[k];
    return `${k}: ${v}`;
  });
};

// Prepare a request/reponse to be logged to the backend.
// Generally respects the "Zapier" request and resp object format.
const prepareRequestLog = (req, resp) => {
  req = req || {};
  resp = resp || {};

  const requestHeaders = prepHeaders(req.headers);

  const respHeaders = prepHeaders(resp.headers);

  let body;
  if (!req.raw) {
    if (typeof resp.content !== 'string') {
      body = JSON.stringify(resp.content);
    } else {
      body = resp.content;
    }
  } else {
    body = '<probably streaming data>';
  }

  const data = {
    log_type: 'http',
    request_type: 'devplatform-outbound',
    request_url: req.url,
    request_method: req.method || 'GET',
    request_headers: requestHeaders.join('\n'),
    request_data: req.body,
    request_via_client: true,
    response_status_code: resp.status,
    response_headers: respHeaders.join('\n'),
    response_content: body
  };

  if (req._requestStart) {
    data.request_duration_ms = new Date() - req._requestStart;
  }

  if (req.url && req.url.indexOf('?') !== -1) {
    data.request_url = req.url.split('?')[0];
    data.request_params = req.url
      .split('?')
      .slice(1)
      .join('?');
  }

  return {
    message: `${data.response_status_code} ${data.request_method} ${
      data.request_url
    }`,
    data: data
  };
};

/*
   Log a response and it's original request to our logger.
*/
const logResponse = resp => {
  const logger = resp.request.input._zapier.logger;
  const logs = prepareRequestLog(resp.request, resp);

  let infoMsg = `Received ${resp.status} code from ${resp.request.url}`;
  if (logs.data.request_duration_ms) {
    infoMsg += ` after ${logs.data.request_duration_ms}ms`;
  }

  resp._addContext(infoMsg);
  resp._addContext(
    `Received content "${String(logs.data.response_content).substr(0, 100)}"`
  );

  // steamroll any results/errors with org response!
  return logger(logs.message, logs.data)
    .then(() => resp)
    .catch(() => resp);
};

module.exports = logResponse;
