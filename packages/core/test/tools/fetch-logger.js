/* global Request */

const assert = require('node:assert/strict');

const { HTTPBIN_URL } = require('../constants');
const wrapFetchWithLogger = require('../../src/tools/fetch-logger');

describe('wrap fetch with logger', () => {
  const logs = [];
  const logger = (message, data) => {
    logs.push({ message, data });
  };
  const newFetch = wrapFetchWithLogger(global.fetch, logger);

  beforeEach(() => {
    logs.length = 0;
  });

  it('should log GET with url string input', async () => {
    const url = `${HTTPBIN_URL}/get?foo=bar`;
    const response = await newFetch(url);
    const data = await response.json();

    // Make sure fetch works as original
    assert.equal(response.status, 200);
    assert.deepEqual(data.args.foo, ['bar']);

    assert.equal(logs.length, 1);

    const log = logs[0];
    assert.equal(log.message, `200 GET ${url}`);
    assert.equal(log.data.request_url, url);
    assert.equal(log.data.request_method, 'GET');
    assert.equal(log.data.response_status_code, 200);

    const loggedHeaders = log.data.response_headers;
    assert.ok(loggedHeaders['content-type'].startsWith('application/json'));

    const loggedContent = JSON.parse(log.data.response_content);
    assert.deepEqual(loggedContent.args.foo, ['bar']);
  });

  it('should log POST with url string input', async () => {
    const url = `${HTTPBIN_URL}/post`;
    const response = await newFetch(url, { method: 'POST', body: 'hello' });
    const data = await response.json();

    // Make sure fetch works as original
    assert.equal(response.status, 200);
    assert.equal(data.data, 'hello');

    assert.equal(logs.length, 1);

    const log = logs[0];
    assert.equal(log.message, `200 POST ${url}`);
    assert.equal(log.data.request_url, url);
    assert.equal(log.data.request_method, 'POST');
    assert.equal(log.data.request_data, 'hello');
    assert.equal(log.data.response_status_code, 200);

    const loggedHeaders = log.data.response_headers;
    assert.ok(loggedHeaders['content-type'].startsWith('application/json'));

    const loggedContent = JSON.parse(log.data.response_content);
    assert.equal(loggedContent.data, 'hello');
  });

  it('should log GET for URL object input', async () => {
    const url = new URL(`${HTTPBIN_URL}/get?foo=bar`);
    const response = await newFetch(url);
    const data = await response.json();

    // Make sure fetch works as original
    assert.equal(response.status, 200);
    assert.deepEqual(data.args.foo, ['bar']);

    assert.equal(logs.length, 1);

    const log = logs[0];
    assert.equal(log.message, `200 GET ${url}`);
    assert.equal(log.data.request_url, url.toString());
    assert.equal(log.data.request_method, 'GET');
    assert.equal(log.data.response_status_code, 200);

    const loggedHeaders = log.data.response_headers;
    assert.ok(loggedHeaders['content-type'].startsWith('application/json'));

    const loggedContent = JSON.parse(log.data.response_content);
    assert.deepEqual(loggedContent.args.foo, ['bar']);
  });

  it('should log POST for Request object input', async () => {
    const url = `${HTTPBIN_URL}/post`;
    const request = new Request(url, { method: 'POST', body: 'hello' });
    const response = await newFetch(request);
    const data = await response.json();

    // Make sure fetch works as original
    assert.equal(response.status, 200);
    assert.equal(data.data, 'hello');

    assert.equal(logs.length, 1);

    const log = logs[0];
    assert.equal(log.message, `200 POST ${url}`);
    assert.equal(log.data.request_url, url);
    assert.equal(log.data.request_method, 'POST');
    // Request.body is always a ReadableStream or null,
    // so we don't log it (for now)
    assert.equal(log.data.request_data, '<unsupported format>');
    assert.equal(log.data.response_status_code, 200);

    const loggedHeaders = log.data.response_headers;
    assert.ok(loggedHeaders['content-type'].startsWith('application/json'));

    const loggedContent = JSON.parse(log.data.response_content);
    assert.equal(loggedContent.data, 'hello');
  });

  it('should log correctly if Request object is overriden', async () => {
    const url = `${HTTPBIN_URL}/put`;
    const request = new Request(url, {
      method: 'POST',
      body: 'hello',
      headers: { 'x-api-key': '12345' },
    });
    const response = await newFetch(request, {
      // These options should override the ones in the Request object
      method: 'PUT',
      body: 'world',
      headers: {
        authorization: 'Bearer 67890',
      },
    });
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.data, 'world');

    assert.equal(logs.length, 1);

    const log = logs[0];
    assert.equal(log.message, `200 PUT ${url}`);
    assert.equal(log.data.request_url, url);
    assert.equal(log.data.request_method, 'PUT');
    assert.equal(log.data.request_data, 'world');
    assert.equal(log.data.response_status_code, 200);

    const loggedHeaders = log.data.response_headers;
    assert.ok(loggedHeaders['content-type'].startsWith('application/json'));

    const loggedContent = JSON.parse(log.data.response_content);
    assert.equal(loggedContent.data, 'world');
  });

  it('should not interfere response body streaming', async () => {
    const url = `${HTTPBIN_URL}/stream/50?chunk_size=100`;
    const response = await newFetch(url);
    const text = await response.text();
    const lines = text.split('\n').filter((line) => line);

    assert.equal(response.status, 200);
    assert.equal(lines.length, 50);

    for (let i = 0; i < lines.length; i++) {
      const obj = JSON.parse(lines[i]);
      assert.equal(obj.id, i);
    }

    assert.equal(logs.length, 1);

    const log = logs[0];
    assert.equal(log.message, `200 GET ${url}`);
    assert.equal(log.data.request_url, url);
    assert.equal(log.data.request_method, 'GET');
    assert.equal(log.data.request_data, '');
    assert.equal(log.data.response_status_code, 200);

    const loggedHeaders = log.data.response_headers;
    assert.ok(loggedHeaders['content-type'].startsWith('text/plain'));

    const loggedContent = log.data.response_content;
    const contentLines = loggedContent.split('\n').filter((line) => line);
    assert.equal(contentLines.length, 50);

    for (let i = 0; i < contentLines.length; i++) {
      const obj = JSON.parse(contentLines[i]);
      assert.equal(obj.id, i);
    }
  });

  it('should not log requests with Zapier user-agent', async () => {
    const url = `${HTTPBIN_URL}/get?made_by=z.request`;
    const response = await newFetch(url, {
      headers: {
        'user-agent': 'Zapier',
      },
    });
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(data.args.made_by, ['z.request']);

    // No logs should be created
    assert.equal(logs.length, 0);
  });

  it('should not reuse logger between calls', async () => {
    const otherLogs = [];
    const anotherLogger = (message, data) => {
      otherLogs.push({ message, data });
    };
    const evenNewerFetch = wrapFetchWithLogger(newFetch, anotherLogger);

    const url = `${HTTPBIN_URL}/get`;
    const response = await evenNewerFetch(url);

    assert.equal(response.status, 200);
    assert.equal(logs.length, 0);

    assert.equal(otherLogs.length, 1);

    const log = otherLogs[0];
    assert.equal(log.message, `200 GET ${url}`);
    assert.equal(log.data.request_url, url);
    assert.equal(log.data.request_method, 'GET');
    assert.equal(log.data.request_data, '');
    assert.equal(log.data.response_status_code, 200);
  });
});
