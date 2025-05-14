'use strict';

const fetch = require('../../tools/fetch');
const _ = require('lodash');
const { StashedBundleError } = require('../../errors');

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

const fetchStashedBundle = async (input) => {
  const stashedBundleKey = _.get(
    input,
    '_zapier.event.stashedBundleKey',
    undefined,
  );
  const rpc = _.get(input, '_zapier.rpc');

  if (stashedBundleKey) {
    // Use the RPC to get a presigned URL for downloading the data
    const s3UrlResponse = await rpc(
      'get_presigned_download_url',
      stashedBundleKey,
    );
    const s3Url = s3UrlResponse.url;
    const response = await withRetry(() => fetch(s3Url));
    if (!response.ok) {
      throw new StashedBundleError('Failed to read stashed bundle from S3.');
    }
    try {
      const stashedBundle = await response.json();
      // Set the bundle to the stashedBundle value
      _.set(input, '_zapier.event.bundle', stashedBundle);
    } catch (error) {
      throw new StashedBundleError('Got an invalid stashed bundle from S3.');
    }
  }
  return input;
};

module.exports = fetchStashedBundle;
