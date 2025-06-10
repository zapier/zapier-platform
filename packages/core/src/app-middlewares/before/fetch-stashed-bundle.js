'use strict';

const _ = require('lodash');
const fetch = require('../../tools/fetch');
const { StashedBundleError } = require('../../errors');
const { withRetry } = require('../../tools/retry-utils');
const { decryptBundleWithSecret } = require('../../tools/bundle-encryption');

const fetchStashedBundle = async (input) => {
  const stashedBundleKey = _.get(
    input,
    '_zapier.event.stashedBundleKey',
    undefined,
  );
  const rpc = _.get(input, '_zapier.rpc');
  const secret = process.env._ZAPIER_ONE_TIME_SECRET;
  if (stashedBundleKey && secret) {
    // Use the RPC to get a presigned URL for downloading the data
    const s3UrlResponse = await rpc(
      'get_presigned_download_url',
      stashedBundleKey,
    );
    const s3Url = s3UrlResponse.url;
    const response = await withRetry(() => fetch(s3Url));
    if (!response.ok) {
      const errorMessage = `Failed to read stashed bundle. Status: ${response.status} ${response.statusText}`;
      throw new StashedBundleError(errorMessage);
    }

    try {
      const responseText = await response.text();
      // Decrypt the bundle
      const stashedBundle = decryptBundleWithSecret(responseText, secret);

      // Set the bundle to the stashedBundle value
      _.set(input, '_zapier.event.bundle', stashedBundle);
    } catch (error) {
      throw new StashedBundleError(error.message);
    }
  }
  return input;
};

module.exports = fetchStashedBundle;
