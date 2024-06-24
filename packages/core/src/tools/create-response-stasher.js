'use strict';

const _ = require('lodash');
const uploader = require('./uploader');
const crypto = require('crypto');

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

// responseStasher uploads the data and returns the URL that points to that data.
const stashResponse = async (input, response, size) => {
  const rpc = _.get(input, '_zapier.rpc');

  if (!rpc) {
    throw new Error('rpc is not available');
  }
  const signedPostData = await rpc('get_presigned_upload_post_data');
  return withRetry(
    _.partial(
      uploader,
      signedPostData,
      response.toString(), // accept JSON string to send to uploader.
      size,
      crypto.randomUUID() + '.txt',
      'text/plain'
    )
  );
};

module.exports = stashResponse;
