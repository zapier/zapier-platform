'use strict';

const crypto = require('crypto');
const fernet = require('fernet');
const zlib = require('zlib');
const {
  decryptBundleWithSecret,
} = require('../../src/tools/bundle-encryption');

describe('bundle-encryption', () => {
  describe('decryptBundleWithSecret', () => {
    it('should decrypt valid Fernet token', () => {
      const testSecret = 'test-secret-key';
      const testData = { test: 'data', number: 42 };

      // Create Fernet key same way as the function does
      const keyHash = crypto.createHash('sha256').update(testSecret).digest();
      const keyBytes = keyHash.subarray(0, 32);
      const fernetKey = keyBytes.toString('base64url');

      // Create encrypted token
      const secret = new fernet.Secret(fernetKey);
      const token = new fernet.Token({
        secret: secret,
        token: '',
        ttl: 0,
      });
      const encryptedToken = token.encode(JSON.stringify(testData));

      const result = decryptBundleWithSecret(encryptedToken, testSecret);
      result.should.eql(testData);
    });

    it('should decrypt complex objects with nested structures', () => {
      const testSecret = 'complex-secret';
      const complexData = {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          metadata: {
            created: '2023-01-01',
            roles: ['admin', 'user'],
          },
        },
        settings: {
          theme: 'dark',
          notifications: true,
          count: 42,
        },
      };

      // Create Fernet key
      const keyHash = crypto.createHash('sha256').update(testSecret).digest();
      const keyBytes = keyHash.subarray(0, 32);
      const fernetKey = keyBytes.toString('base64url');

      // Create encrypted token
      const secret = new fernet.Secret(fernetKey);
      const token = new fernet.Token({
        secret: secret,
        token: '',
        ttl: 0,
      });
      const encryptedToken = token.encode(JSON.stringify(complexData));

      const result = decryptBundleWithSecret(encryptedToken, testSecret);
      result.should.eql(complexData);
    });

    it('should throw error for invalid Fernet token', () => {
      const testSecret = 'test-secret-key';

      (() => {
        decryptBundleWithSecret('invalid-token', testSecret);
      }).should.throw(/Bundle decryption failed/);
    });

    it('should throw error for empty token', () => {
      const testSecret = 'test-secret-key';

      (() => {
        decryptBundleWithSecret('', testSecret);
      }).should.throw(/Invalid object from s3/);
    });

    it('should throw error for null token', () => {
      const testSecret = 'test-secret-key';

      (() => {
        decryptBundleWithSecret(null, testSecret);
      }).should.throw(/Invalid object from s3/);
    });

    it('should throw error for empty secret', () => {
      const testToken = 'gAAAAABhZ_test_token';

      (() => {
        decryptBundleWithSecret(testToken, '');
      }).should.throw(/Invalid secret/);
    });

    it('should throw error for null secret', () => {
      const testToken = 'gAAAAABhZ_test_token';

      (() => {
        decryptBundleWithSecret(testToken, null);
      }).should.throw(/Invalid secret/);
    });

    it('should throw error for non-string token', () => {
      (() => {
        decryptBundleWithSecret(123, 'secret');
      }).should.throw(/Invalid object from s3/);
    });

    it('should throw error for non-string secret', () => {
      (() => {
        decryptBundleWithSecret('token', 123);
      }).should.throw(/Invalid secret/);
    });

    it('should throw error for invalid JSON in decrypted content', () => {
      const testSecret = 'test-secret-key';

      // Create Fernet key
      const keyHash = crypto.createHash('sha256').update(testSecret).digest();
      const keyBytes = keyHash.subarray(0, 32);
      const fernetKey = keyBytes.toString('base64url');

      // Create encrypted token with invalid JSON
      const secret = new fernet.Secret(fernetKey);
      const token = new fernet.Token({
        secret: secret,
        token: '',
        ttl: 0,
      });
      const encryptedToken = token.encode('invalid json content {broken}');

      (() => {
        decryptBundleWithSecret(encryptedToken, testSecret);
      }).should.throw(/Invalid JSON in decrypted bundle/);
    });

    it('should handle different secret lengths', () => {
      const shortSecret = 'short';
      const longSecret =
        'this-is-a-very-long-secret-key-that-exceeds-32-characters-easily';
      const testData = { message: 'hello world' };

      // Test short secret
      const keyHash1 = crypto.createHash('sha256').update(shortSecret).digest();
      const keyBytes1 = keyHash1.subarray(0, 32);
      const fernetKey1 = keyBytes1.toString('base64url');
      const secret1 = new fernet.Secret(fernetKey1);
      const token1 = new fernet.Token({ secret: secret1, token: '', ttl: 0 });
      const encrypted1 = token1.encode(JSON.stringify(testData));

      const result1 = decryptBundleWithSecret(encrypted1, shortSecret);
      result1.should.eql(testData);

      // Test long secret
      const keyHash2 = crypto.createHash('sha256').update(longSecret).digest();
      const keyBytes2 = keyHash2.subarray(0, 32);
      const fernetKey2 = keyBytes2.toString('base64url');
      const secret2 = new fernet.Secret(fernetKey2);
      const token2 = new fernet.Token({ secret: secret2, token: '', ttl: 0 });
      const encrypted2 = token2.encode(JSON.stringify(testData));

      const result2 = decryptBundleWithSecret(encrypted2, longSecret);
      result2.should.eql(testData);
    });

    it('should decrypt new compressed format with gzip compression', () => {
      const testSecret = 'test-secret-key';
      const testData = {
        large: 'data'.repeat(1000),
        nested: {
          values: [1, 2, 3, 4, 5],
          metadata: { created: '2023-01-01', type: 'test' },
        },
      };

      // Create Fernet key same way as the function does
      const keyHash = crypto.createHash('sha256').update(testSecret).digest();
      const keyBytes = keyHash.subarray(0, 32);
      const fernetKey = keyBytes.toString('base64url');

      // Step 1: JSON stringify the data
      const jsonString = JSON.stringify(testData);

      // Step 2: Compress with gzip
      const compressedData = zlib.gzipSync(jsonString);

      // Step 3: Base64 encode the compressed data
      const base64EncodedData = compressedData.toString('base64');

      // Step 4: Encrypt with Fernet
      const secret = new fernet.Secret(fernetKey);
      const token = new fernet.Token({
        secret: secret,
        token: '',
        ttl: 0,
      });
      const encryptedToken = token.encode(base64EncodedData);

      // Test decryption
      const result = decryptBundleWithSecret(encryptedToken, testSecret);
      result.should.eql(testData);
    });

    it('should handle backward compatibility with old uncompressed format', () => {
      const testSecret = 'test-secret-key';
      const testData = { old: 'format', without: 'compression' };

      // Create Fernet key same way as the function does
      const keyHash = crypto.createHash('sha256').update(testSecret).digest();
      const keyBytes = keyHash.subarray(0, 32);
      const fernetKey = keyBytes.toString('base64url');

      // Create encrypted token in old format (JSON string directly)
      const secret = new fernet.Secret(fernetKey);
      const token = new fernet.Token({
        secret: secret,
        token: '',
        ttl: 0,
      });
      const encryptedToken = token.encode(JSON.stringify(testData));

      // Test decryption - should fallback to old format
      const result = decryptBundleWithSecret(encryptedToken, testSecret);
      result.should.eql(testData);
    });

    it('should prefer compressed format over uncompressed when both are valid', () => {
      const testSecret = 'test-secret-key';
      const testData = { message: 'This data should be compressed' };

      // Create Fernet key
      const keyHash = crypto.createHash('sha256').update(testSecret).digest();
      const keyBytes = keyHash.subarray(0, 32);
      const fernetKey = keyBytes.toString('base64url');

      // Create data that could be interpreted as both formats
      // First create a JSON string that when base64 decoded and decompressed gives our test data
      const jsonString = JSON.stringify(testData);
      const compressedData = zlib.gzipSync(jsonString);
      const base64EncodedData = compressedData.toString('base64');

      const secret = new fernet.Secret(fernetKey);
      const token = new fernet.Token({
        secret: secret,
        token: '',
        ttl: 0,
      });
      const encryptedToken = token.encode(base64EncodedData);

      const result = decryptBundleWithSecret(encryptedToken, testSecret);
      result.should.eql(testData);
    });

    it('should handle compression of large nested objects', () => {
      const testSecret = 'test-secret-key';
      const testData = {
        users: Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          name: `User ${i + 1}`,
          email: `user${i + 1}@example.com`,
          metadata: {
            created: `2023-01-${String(i + 1).padStart(2, '0')}`,
            roles: ['user', 'member'],
            settings: {
              theme: 'dark',
              notifications: true,
              language: 'en',
            },
          },
        })),
        pagination: {
          page: 1,
          limit: 100,
          total: 1000,
          hasMore: true,
        },
      };

      // Create Fernet key
      const keyHash = crypto.createHash('sha256').update(testSecret).digest();
      const keyBytes = keyHash.subarray(0, 32);
      const fernetKey = keyBytes.toString('base64url');

      // Create compressed encrypted token
      const jsonString = JSON.stringify(testData);
      const compressedData = zlib.gzipSync(jsonString);
      const base64EncodedData = compressedData.toString('base64');

      const secret = new fernet.Secret(fernetKey);
      const token = new fernet.Token({
        secret: secret,
        token: '',
        ttl: 0,
      });
      const encryptedToken = token.encode(base64EncodedData);

      const result = decryptBundleWithSecret(encryptedToken, testSecret);
      result.should.eql(testData);
    });

    it('should throw error when compressed data is corrupted', () => {
      const testSecret = 'test-secret-key';

      // Create Fernet key
      const keyHash = crypto.createHash('sha256').update(testSecret).digest();
      const keyBytes = keyHash.subarray(0, 32);
      const fernetKey = keyBytes.toString('base64url');

      // Create corrupted compressed data (not valid gzip)
      const corruptedData = Buffer.from('corrupted compressed data');
      const base64EncodedData = corruptedData.toString('base64');

      const secret = new fernet.Secret(fernetKey);
      const token = new fernet.Token({
        secret: secret,
        token: '',
        ttl: 0,
      });
      const encryptedToken = token.encode(base64EncodedData);

      // Should fallback to old format and try to parse "corrupted compressed data" as JSON
      // This should fail with Invalid JSON error
      (() => {
        decryptBundleWithSecret(encryptedToken, testSecret);
      }).should.throw(/Invalid JSON in decrypted bundle/);
    });
  });
});
