'use strict';

const crypto = require('crypto');
const fernet = require('fernet');
const zlib = require('zlib');
/**
 * Decrypt a bundle using secret key
 *
 * This matches the backend:
 * 1. Hash the secret with SHA256 to get 32 bytes
 * 2. Base64url encode those bytes to make Fernet-compatible key
 * 3. Use Fernet library to decrypt (handles all token parsing internally)
 * 4. Base64 decode the decrypted string to get compressed binary data
 * 5. Decompress the data using gzip
 *
 * @param {string} bundle - The bundle represented as an encrypted token
 * @param {string} secret - The secret key for decryption
 * @returns {Object} The decrypted and decompressed bundle object
 */
const decryptBundleWithSecret = (bundle, secret) => {
  try {
    // Validate input
    if (!bundle || typeof bundle !== 'string') {
      throw new Error('Invalid object from s3 - must be a non-empty string');
    }

    if (!secret || typeof secret !== 'string') {
      throw new Error('Invalid secret - must be a non-empty string');
    }

    // Step 1: Create the same key as backend
    // Hash the secret and take first 32 bytes, then base64url encode for Fernet
    const keyHash = crypto.createHash('sha256').update(secret).digest();
    const keyBytes = keyHash.subarray(0, 32); // Take first 32 bytes
    const fernetKey = keyBytes.toString('base64url'); // Use built-in base64url encoding
    // Use Fernet library to decrypt (handles all the token parsing)
    const secretObj = new fernet.Secret(fernetKey);
    const token = new fernet.Token({
      secret: secretObj,
      token: bundle,
      ttl: 0,
    });

    // Step 2: Decrypt the token - this should now be a valid UTF-8 string (base64 encoded)
    let decryptedString;
    try {
      decryptedString = token.decode();
    } catch (fernetError) {
      throw new Error(`Fernet decryption failed: ${fernetError.message}`);
    }

    // Step 3: The decrypted data should be a base64 encoded string
    // Base64 decode it to get the compressed binary data
    let compressedBytes;
    try {
      compressedBytes = Buffer.from(decryptedString, 'base64');
    } catch (base64Error) {
      throw new Error(`Base64 decoding failed: ${base64Error.message}`);
    }

    // Step 4: The data is compressed, so we need to decompress it
    let decompressed;
    try {
      // Try to decompress first (for new format with compression)
      decompressed = zlib.gunzipSync(compressedBytes).toString('utf8');
    } catch (decompressionError) {
      // If decompression fails, assume it's the old format without compression
      // This provides backward compatibility
      decompressed = decryptedString;
    }

    // Step 5: Parse JSON
    try {
      return JSON.parse(decompressed);
    } catch (error) {
      throw new Error('Invalid JSON in decrypted bundle');
    }
  } catch (error) {
    throw new Error(`Bundle decryption failed: ${error.message}`);
  }
};
module.exports = {
  decryptBundleWithSecret,
};
