const { promisify } = require('util');

const request = require('request');
const { runAsWorker } = require('synckit');

const { isMainThread } = require('worker_threads');

if (!isMainThread) {
  const asyncRequest = promisify(request);

  runAsWorker(async (options) => {
    const response = await asyncRequest(options);

    // Remove unnecessary fields as the result will serialized by
    // https://developer.mozilla.org/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
    return {
      statusCode: response.statusCode,
      headers: { ...response.headers },
      body: response.body,
    };
  });
}
