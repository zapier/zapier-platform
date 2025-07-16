'use strict';

const _ = require('lodash');
const fetch = require('node-fetch');
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
    let response;
    try {
      // Use the RPC to get a presigned URL for downloading the data
      const rpcResponse = await rpc(
        'get_presigned_download_url',
        stashedBundleKey,
      );

      response = await withRetry(() => fetch(rpcResponse.url));

      if (!response.ok) {
        // Consume the response body to prevent memory leaks
        await response.text().catch(() => {}); // Ignore errors, just consume
        const errorMessage = `Failed to read stashed bundle. Status: ${response.status} ${response.statusText}`;
        throw new StashedBundleError(errorMessage);
      }

      // Load response text once and pass it through
      let responseText = await response.text();

      try {
        // Decrypt the bundle (this will create another copy internally in fernet)
        const stashedBundle = decryptBundleWithSecret(responseText, secret);

        // Release the encrypted text from memory immediately after decryption
        responseText = null;

        // Set the bundle to the stashedBundle value
        _.set(input, '_zapier.event.bundle', stashedBundle);
      } catch (error) {
        // Release memory on error
        responseText = null;
        throw new StashedBundleError(error.message);
      }
    } catch (error) {
      // Ensure response body is consumed even on error to prevent memory leaks
      if (response && !response.bodyUsed) {
        try {
          await response.text();
        } catch (consumeError) {
          // Ignore errors when consuming response body for cleanup
        }
      }

      if (error instanceof StashedBundleError) {
        throw error;
      }
      throw new StashedBundleError(error.message);
    }
  }
  return input;
};

module.exports = fetchStashedBundle;
