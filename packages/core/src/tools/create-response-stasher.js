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
const stashResponse = async (input, response) => {
  const rpc = _.get(input, '_zapier.rpc');

  if (!rpc) {
    throw new Error('rpc is not available');
  }
  const signedPostData = await rpc('get_presigned_upload_post_data');

  // Encode the response to base64 to avoid uploading any non-ascii characters
  const encodedResponse = Buffer.from(response).toString('base64');

  return withRetry(
    _.partial(
      uploader,
      signedPostData,
      encodedResponse,
      encodedResponse.length,
      crypto.randomUUID() + '.txt',
      'text/plain',
    ),
  );
};

module.exports = stashResponse;
