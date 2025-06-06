'use strict';

const crypto = require('crypto');
const fernet = require('fernet');
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
  });
});
