'use strict';

const fetch = require('node-fetch');
const rpc = require('../../tools/rpc');
const _ = require('lodash');

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
  const stashedBundleKey = _.get(input, '_zapier.event.stashedBundleKey', {});

  if (stashedBundleKey) {
    // Use the RPC to get a presigned URL for downloading the data
    const s3Url = await rpc(
      'generate_presigned_download_url',
      stashedBundleKey,
    );
    const response = await withRetry(() => fetch(s3Url));
    if (!response.ok) {
      throw new Error('Failed to fetch stashed bundle from S3.');
    }
    try {
      const stashedBundle = await response.json();
      // Get the existing bundle
      // Try to set it to stashed bundle
      // If errors then use the existing bundle
      // Set the bundle to the stashedBundle value
      _.set(input, '_zapier.event.bundle', stashedBundle);
    } catch (error) {
      throw new Error('Failed to read stashed bundle from S3 response.');
    }
  }
  return input;
};

module.exports = fetchStashedBundle;
