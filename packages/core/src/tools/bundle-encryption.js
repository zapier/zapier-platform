'use strict';

const crypto = require('crypto');
const fernet = require('fernet');

/**
 * Decrypt a bundle using secret key
 *
 * This matches the backend:
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
    const keyBytes = keyHash.subarray(0, 32); // Take first 32 bytes
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

module.exports = {
  decryptBundleWithSecret,
};
