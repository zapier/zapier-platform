'use strict';

const _ = require('lodash');
const request = require('./request-client-internal');

const withRetry = async (fn, retries = 3, delay = 100, attempt = 0) => {
  try {
    return await fn();
  } catch (error) {
    if (attempt >= retries) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    return withRetry(fn, retries, delay, attempt + 1);
  }
};

// Function to handle uploading JSON payload
const uploader = async (signedPostData, jsonData) => {
  const response = await request({
    url: signedPostData.url,
    method: 'POST',
    body: jsonData,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 204) {
    return new URL(signedPostData.fields.key, signedPostData.url).href;
  }

  throw new Error(
    `Response stasher failed with status ${response.status} - ${response.content}`
  );
};

// Main function to process the request or data for uploading
const createResponseStasher = (input) => {
  const rpc = _.get(input, '_zapier.rpc');

  return async (jsonData) => {
    if (!rpc) {
      throw new Error('RPC is not available');
    }

    const signedPostData = await rpc('get_presigned_upload_post_data');
    return withRetry(uploader(signedPostData, jsonData));
  };
};

module.exports = createResponseStasher;
