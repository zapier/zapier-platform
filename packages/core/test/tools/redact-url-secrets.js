'use strict';

const should = require('should');
const redactUrlSecrets = require('../../src/tools/redact-url-secrets');

describe('redactUrlSecrets', () => {
  it('redacts api_key in a node-fetch error', () => {
    const out = redactUrlSecrets(
      'request to https://x.test/api/test-connection?api_key=fv_SECRET failed, reason: connect ECONNREFUSED 1.2.3.4:443',
    );
    should(out).not.containEql('fv_SECRET');
    should(out).containEql('?api_key=[redacted] failed, reason:');
  });

  it('keeps harmless params and redacts other secret params', () => {
    should(
      redactUrlSecrets(
        'https://x.test/a?page=2&access_token=abc&Client-Secret=def&q=hi',
      ),
    ).eql(
      'https://x.test/a?page=2&access_token=[redacted]&Client-Secret=[redacted]&q=hi',
    );
  });

  it('passes non-strings through', () => {
    should(redactUrlSecrets(undefined)).eql(undefined);
  });
});
