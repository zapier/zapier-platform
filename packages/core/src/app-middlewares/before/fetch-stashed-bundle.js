'use strict';

const fetch = require('../../tools/fetch');
const _ = require('lodash');
const { StashedBundleError } = require('../../errors');
const crypto = require('crypto');
// Use the fernet npm package for proper Fernet token handling
const fernet = require('fernet');

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

/**
 * Decrypt a bundle using secret key
 *
 * This matches the backend implementation:
 * 1. Hash the secret with SHA256 to get 32 bytes
 * 2. Base64url encode those bytes to make Fernet-compatible key
 * 3. Use Fernet library to decrypt (handles all token parsing internally)
 *
 * @param {string} fernetToken - The Fernet token to decrypt
 * @param {string} secret - The secret key for decryption
 * @returns {Object} The decrypted bundle object
 */
const decryptBundleWithSecret = (fernetToken, secret) => {
  try {
    // Validate input
    if (!fernetToken || typeof fernetToken !== 'string') {
      throw new Error('Invalid object from s3 - must be a non-empty string');
    }

    if (!secret || typeof secret !== 'string') {
      throw new Error('Invalid secret - must be a non-empty string');
    }

    // Create the same key as backend
    // Hash the secret and take first 32 bytes, then base64url encode for Fernet
    const keyHash = crypto.createHash('sha256').update(secret).digest();
    const keyBytes = keyHash.subarray(0, 32);
    const fernetKey = keyBytes.toString('base64url'); // Use built-in base64url encoding

    // Use Fernet library to decrypt (handles all the token parsing)
    const token = new fernet.Token({
      secret: new fernet.Secret(fernetKey),
      token: fernetToken,
      ttl: 0,
    });

    const decrypted = token.decode();

    // Parse JSON
    try {
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error('Invalid JSON in decrypted bundle');
    }
  } catch (error) {
    throw new Error(`Bundle decryption failed: ${error.message}`);
  }
};

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
      throw new StashedBundleError('Failed to read stashed bundle from S3.');
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
