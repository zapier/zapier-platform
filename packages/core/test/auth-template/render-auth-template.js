'use strict';

require('should');

const renderAuthTemplate = require('../../src/auth-template/render-auth-template');

const buildInput = (compiledApp, authData = {}, bundleExtras = {}) => {
  const bundle = { authData, ...bundleExtras };
  return {
    bundle,
    _zapier: {
      app: compiledApp,
      event: { bundle },
      promises: [],
      logger: () => Promise.resolve(),
      logBuffer: [],
      whatHappened: [],
    },
  };
};

const run = (compiledApp, authData, bundleExtras) =>
  renderAuthTemplate(
    compiledApp,
    buildInput(compiledApp, authData, bundleExtras),
  );

describe('renderAuthTemplate', () => {
  describe('early returns', () => {
    it('returns null authType with empty template when no authentication', async () => {
      const result = await run({});
      result.should.deepEqual({ authType: null, template: {} });
    });
  });

  describe('beforeRequest pipeline', () => {
    it('renders auth headers added by a beforeRequest function', async () => {
      const beforeRequest = (req, z, bundle) => {
        if (bundle.authData.access_token) {
          req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
        }
        return req;
      };
      const result = await run(
        {
          authentication: {
            type: 'oauth2',
            test: { url: 'https://example.com' },
            fields: [{ key: 'access_token' }],
          },
          beforeRequest: [beforeRequest],
        },
        { access_token: 'real-token-123' },
      );
      result.authType.should.eql('oauth2');
      result.template.headers.Authorization.should.eql('Bearer real-token-123');
    });

    it('accepts beforeRequest as a single function (not an array)', async () => {
      const beforeRequest = (req, z, bundle) => {
        if (bundle.authData.api_key) {
          req.headers['X-Api-Key'] = bundle.authData.api_key;
        }
        return req;
      };
      const result = await run(
        {
          authentication: {
            type: 'custom',
            test: { url: 'https://example.com' },
            fields: [{ key: 'api_key' }],
          },
          beforeRequest,
        },
        { api_key: 'real-key-abc' },
      );
      result.template.headers['X-Api-Key'].should.eql('real-key-abc');
    });

    it('renders requestTemplate via prepareRequest merge', async () => {
      const result = await run(
        {
          authentication: {
            type: 'oauth2',
            test: { url: 'https://example.com' },
            fields: [{ key: 'access_token' }],
          },
          requestTemplate: {
            headers: {
              Authorization: 'Bearer {{bundle.authData.access_token}}',
            },
          },
        },
        { access_token: 'real-token-xyz' },
      );
      result.template.headers.Authorization.should.eql('Bearer real-token-xyz');
    });

    it('renders both requestTemplate and beforeRequest contributions', async () => {
      const beforeRequest = (req, z, bundle) => {
        req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
        return req;
      };
      const result = await run(
        {
          authentication: {
            type: 'oauth2',
            test: { url: 'https://example.com' },
            fields: [{ key: 'access_token' }, { key: 'tenant' }],
          },
          requestTemplate: {
            headers: { 'X-Tenant': '{{bundle.authData.tenant}}' },
          },
          beforeRequest: [beforeRequest],
        },
        { access_token: 'real-token', tenant: 'acme' },
      );
      result.template.headers.Authorization.should.eql('Bearer real-token');
      result.template.headers['X-Tenant'].should.eql('acme');
    });

    it('returns error when the pipeline throws', async () => {
      const beforeRequest = () => {
        throw new Error('middleware blew up');
      };
      const result = await run(
        {
          authentication: { type: 'custom', fields: [{ key: 'api_key' }] },
          beforeRequest: [beforeRequest],
        },
        { api_key: 'x' },
      );
      result.authType.should.eql('custom');
      result.error.should.match(/middleware blew up/);
      result.template.should.deepEqual({});
    });
  });

  describe('targetRequest', () => {
    it('threads url, method, body, headers, and params into the middleware', async () => {
      let observed = null;
      const beforeRequest = (req) => {
        observed = {
          url: req.url,
          method: req.method,
          body: req.body,
          headers: { ...req.headers },
          params: { ...req.params },
        };
        return req;
      };
      await run(
        {
          authentication: {
            type: 'custom',
            test: { url: 'https://example.com' },
          },
          beforeRequest: [beforeRequest],
        },
        { api_key: 'x' },
        {
          targetRequest: {
            url: 'https://api.bedrock.aws.com/invoke',
            method: 'POST',
            body: '{"prompt":"hi"}',
            headers: { 'Content-Type': 'application/json' },
            params: { foo: 'bar' },
          },
        },
      );
      observed.url.should.eql('https://api.bedrock.aws.com/invoke');
      observed.method.should.eql('POST');
      observed.body.should.eql('{"prompt":"hi"}');
      observed.headers['Content-Type'].should.eql('application/json');
      observed.params.foo.should.eql('bar');
    });

    it('falls back to stub values when targetRequest is absent', async () => {
      let observed = null;
      const beforeRequest = (req) => {
        observed = { url: req.url, method: req.method };
        return req;
      };
      await run(
        {
          authentication: {
            type: 'custom',
            test: { url: 'https://example.com' },
          },
          beforeRequest: [beforeRequest],
        },
        { api_key: 'x' },
      );
      observed.url.should.eql('https://example.com');
      observed.method.should.eql('GET');
    });

    it('lets signature-style middleware sign the real request', async () => {
      // Simulates a SigV4-style signer that hashes method+url+body
      const beforeRequest = (req, _z, bundle) => {
        const payload = `${req.method}|${req.url}|${req.body || ''}`;
        req.headers['X-Signature'] =
          `sig:${payload}:${bundle.authData.secret_key}`;
        return req;
      };
      const result = await run(
        {
          authentication: {
            type: 'custom',
            test: { url: 'https://example.com' },
          },
          beforeRequest: [beforeRequest],
        },
        { secret_key: 'shh' },
        {
          targetRequest: {
            url: 'https://api.example.com/widgets',
            method: 'POST',
            body: '{"a":1}',
          },
        },
      );
      result.template.headers['X-Signature'].should.eql(
        'sig:POST|https://api.example.com/widgets|{"a":1}:shh',
      );
    });
  });

  describe('customRequestProperties', () => {
    // Slack-shaped middleware: defaults to bot_token, switches to
    // access_token when the request carries `withUserToken: true`.
    const slackShapedMiddleware = (req, z, bundle) => {
      if (req.withManualToken) {
        return req;
      }
      if (bundle.authData.bot_token) {
        req.headers.Authorization = `Bearer ${bundle.authData.bot_token}`;
      }
      if (req.withUserToken) {
        req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
      }
      return req;
    };

    const slackShapedApp = {
      authentication: {
        type: 'oauth2',
        test: { url: 'https://example.com' },
      },
      beforeRequest: [slackShapedMiddleware],
    };

    const slackShapedAuthData = {
      bot_token: 'xoxb-bot-token',
      access_token: 'xoxp-user-token',
    };

    it('spreads custom properties onto the synthetic request', async () => {
      const result = await run(slackShapedApp, slackShapedAuthData, {
        customRequestProperties: { withUserToken: true },
      });
      result.template.headers.Authorization.should.eql(
        'Bearer xoxp-user-token',
      );
    });

    it('takes the middleware default path when absent', async () => {
      const result = await run(slackShapedApp, slackShapedAuthData);
      result.template.headers.Authorization.should.eql('Bearer xoxb-bot-token');
    });

    it('takes the middleware default path when empty', async () => {
      const result = await run(slackShapedApp, slackShapedAuthData, {
        customRequestProperties: {},
      });
      result.template.headers.Authorization.should.eql('Bearer xoxb-bot-token');
    });

    it('supports skip-style flags that suppress auth injection', async () => {
      const result = await run(slackShapedApp, slackShapedAuthData, {
        customRequestProperties: { withManualToken: true },
      });
      (result.template.headers === undefined ||
        result.template.headers.Authorization === undefined).should.be.true();
    });

    it('combines with targetRequest without clobbering HTTP fields', async () => {
      let observed = null;
      const observingMiddleware = (req, z, bundle) => {
        observed = { url: req.url, method: req.method };
        return slackShapedMiddleware(req, z, bundle);
      };
      const result = await run(
        {
          ...slackShapedApp,
          beforeRequest: [observingMiddleware],
        },
        slackShapedAuthData,
        {
          targetRequest: {
            url: 'https://slack.com/api/chat.postMessage',
            method: 'POST',
          },
          customRequestProperties: { withUserToken: true },
        },
      );
      observed.url.should.eql('https://slack.com/api/chat.postMessage');
      observed.method.should.eql('POST');
      result.template.headers.Authorization.should.eql(
        'Bearer xoxp-user-token',
      );
    });
  });

  describe('auth-type-specific middleware', () => {
    it('basic auth applies the addBasicAuthHeader middleware', async () => {
      const result = await run(
        { authentication: { type: 'basic' } },
        { username: 'alice', password: 's3cret' },
      );
      // addBasicAuthHeader produces `Basic base64(user:pass)`
      const expected =
        'Basic ' + Buffer.from('alice:s3cret').toString('base64');
      result.template.headers.Authorization.should.eql(expected);
    });

    it('oauth1 applies the oauth1SignRequest middleware', async () => {
      // oauth1SignRequest reads from req.auth (set by a beforeRequest), then
      // signs the request and emits an `Authorization: OAuth ...` header.
      const beforeRequest = (req, z, bundle) => {
        req.auth = {
          oauth_consumer_key: bundle.authData.consumer_key,
          oauth_consumer_secret: bundle.authData.consumer_secret,
          oauth_token: bundle.authData.oauth_token,
          oauth_token_secret: bundle.authData.oauth_token_secret,
        };
        return req;
      };
      const result = await run(
        {
          authentication: {
            type: 'oauth1',
            fields: [
              { key: 'consumer_key' },
              { key: 'consumer_secret' },
              { key: 'oauth_token' },
              { key: 'oauth_token_secret' },
            ],
          },
          beforeRequest: [beforeRequest],
        },
        {
          consumer_key: 'ck',
          consumer_secret: 'cs',
          oauth_token: 'ot',
          oauth_token_secret: 'ots',
        },
      );
      result.authType.should.eql('oauth1');
      result.template.headers.Authorization.should.match(/^OAuth /);
      result.template.headers.Authorization.should.match(
        /oauth_consumer_key="ck"/,
      );
      result.template.headers.Authorization.should.match(/oauth_token="ot"/);
    });
  });

  describe('inline-auth fallback (auth.test as object)', () => {
    it('renders headers from a static test object via renderFromTest', async () => {
      // No beforeRequest, no requestTemplate. Pipeline produces an empty
      // template; renderFromTest substitutes placeholder strings in the test
      // object headers with real authData values.
      const result = await run(
        {
          authentication: {
            type: 'custom',
            fields: [{ key: 'api_key' }],
            test: {
              url: 'https://example.com/me',
              headers: { 'X-Api-Key': '{{bundle.authData.api_key}}' },
            },
          },
        },
        { api_key: 'real-fallback-key' },
      );
      result.template.headers['X-Api-Key'].should.eql('real-fallback-key');
    });

    it('renders params from a static test object via renderFromTest', async () => {
      const result = await run(
        {
          authentication: {
            type: 'custom',
            fields: [{ key: 'api_key' }],
            test: {
              url: 'https://example.com/me',
              params: { token: '{{bundle.authData.api_key}}' },
            },
          },
        },
        { api_key: 'real-key' },
      );
      result.template.params.token.should.eql('real-key');
    });

    it('returns empty template when test object has no placeholders to render', async () => {
      // Test object exists but doesn't reference any authData placeholders —
      // nothing for renderFromTest to emit.
      const result = await run(
        {
          authentication: {
            type: 'custom',
            fields: [{ key: 'api_key' }],
            test: { url: 'https://example.com/me' },
          },
        },
        { api_key: 'real-key' },
      );
      result.template.should.deepEqual({});
    });
  });

  describe('inline-auth fallback (auth.test as function)', () => {
    it('renders auth from inline z.request config when test is a function', async () => {
      // Inline-auth pattern: no beforeRequest, no requestTemplate. Auth lives
      // inside the test function's z.request config. The inline fallback runs
      // the test function with real authData and captures the prepared
      // request.
      const result = await run(
        {
          authentication: {
            type: 'custom',
            fields: [{ key: 'api_key' }],
            test: async (z, bundle) => {
              const resp = await z.request({
                url: 'https://example.com/me',
                headers: { 'X-Api-Key': bundle.authData.api_key },
              });
              return resp.data;
            },
          },
        },
        { api_key: 'real-inline-key' },
      );
      result.template.headers['X-Api-Key'].should.eql('real-inline-key');
    });

    it('still captures the request when the test function throws after z.request', async () => {
      // Test functions often parse the response and crash on the empty stub.
      // The captured request is preserved.
      const result = await run(
        {
          authentication: {
            type: 'custom',
            fields: [{ key: 'api_key' }],
            test: async (z, bundle) => {
              const resp = await z.request({
                url: 'https://example.com/me',
                headers: { 'X-Api-Key': bundle.authData.api_key },
              });
              return resp.data.user.email; // crashes — resp.data is {}
            },
          },
        },
        { api_key: 'real-key' },
      );
      result.template.headers['X-Api-Key'].should.eql('real-key');
    });

    it('captures via raw http/fetch when the test function bypasses z.request', async () => {
      // Some test functions construct a request via raw fetch (or via SDKs
      // that destructure http.request at import time). The withHttpCapture
      // safety net catches them.
      const result = await run(
        {
          authentication: {
            type: 'custom',
            fields: [{ key: 'api_key' }],
            test: async (z, bundle) => {
              await fetch('https://example.com/me', {
                headers: { 'X-Api-Key': bundle.authData.api_key },
              });
            },
          },
        },
        { api_key: 'raw-fetch-key' },
      );
      result.template.headers['X-Api-Key'].should.eql('raw-fetch-key');
    });

    it('returns empty template when the test function never makes a request', async () => {
      const result = await run(
        {
          authentication: {
            type: 'custom',
            fields: [{ key: 'api_key' }],
            test: async () => ({ ok: true }),
          },
        },
        { api_key: 'unused' },
      );
      result.template.should.deepEqual({});
    });

    it('skips the function fallback when beforeRequest already captured auth', async () => {
      // BR's contribution makes the pipeline-captured template non-empty,
      // so the function fallback's `Object.keys(template).length === 0`
      // guard fails and the testFn is not invoked. Verified by the test
      // function throwing — if it ran, render would either swallow the
      // throw and proceed, or end up with an empty template; here we get
      // the BR-rendered template back.
      const beforeRequest = (req, z, bundle) => {
        req.headers = req.headers || {};
        req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
        return req;
      };
      const result = await run(
        {
          authentication: {
            type: 'oauth2',
            fields: [{ key: 'access_token' }],
            test: async () => {
              throw new Error('test fn should not run');
            },
          },
          beforeRequest: [beforeRequest],
        },
        { access_token: 'real-token' },
      );
      result.template.headers.Authorization.should.eql('Bearer real-token');
    });
  });

  describe('legacy scripting bridge', () => {
    it('handles beforeRequest that delegates to z.legacyScripting.beforeRequest', async () => {
      // Apps converted from legacy Web Builder define a beforeRequest that
      // forwards to `z.legacyScripting.beforeRequest`. Render's stubZ must
      // provide a legacyScripting bridge that applies the legacy auth
      // mapping; otherwise the call throws "Cannot read properties of
      // undefined (reading 'beforeRequest')".
      const beforeRequest = async (request, z, bundle) => {
        return z.legacyScripting.beforeRequest(request, z, bundle);
      };
      const result = await run(
        {
          authentication: {
            type: 'custom',
            fields: [{ key: 'api_key' }, { key: 'api_url' }],
          },
          legacy: {
            authentication: {
              placement: 'header',
              mapping: { 'X-Api-Key': '{{api_key}}' },
            },
          },
          beforeRequest: [beforeRequest],
        },
        { api_key: 'real-key', api_url: 'https://example.com' },
      );
      result.authType.should.eql('custom');
      result.template.headers['X-Api-Key'].should.eql('real-key');
    });

    it('renders basic auth correctly even when beforeRequest delegates to legacyScripting', async () => {
      // Legacy basic-auth apps: addBasicAuthHeader sets the Authorization
      // header before the user's BR runs. The legacy BR is then a no-op
      // for auth purposes, but it must not crash the pipeline.
      const beforeRequest = async (request, z, bundle) => {
        return z.legacyScripting.beforeRequest(request, z, bundle);
      };
      const result = await run(
        {
          authentication: {
            type: 'basic',
            fields: [{ key: 'username' }, { key: 'password' }],
          },
          beforeRequest: [beforeRequest],
        },
        { username: 'alice', password: 's3cret' },
      );
      const expected =
        'Basic ' + Buffer.from('alice:s3cret').toString('base64');
      result.template.headers.Authorization.should.eql(expected);
    });
  });

  describe('beforeRequest with z.request (real network call)', () => {
    let origFetch;
    beforeEach(() => {
      origFetch = globalThis.fetch;
    });
    afterEach(() => {
      globalThis.fetch = origFetch;
    });

    it('routes beforeRequest internal z.request calls through real fetch', async () => {
      // Refresh-token-style pattern: BR fetches an auxiliary value and uses
      // it to set the auth header. The render path replaces stubZ.request
      // with a real fetch-backed implementation so this works.
      let capturedFetchUrl = null;
      globalThis.fetch = async (url) => {
        capturedFetchUrl = url;
        return new Response('encoded-' + url.split('/').pop(), {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        });
      };

      const beforeRequest = async (req, z, bundle) => {
        const resp = await z.request({
          url: `https://encoder.example.com/encode/${bundle.authData.api_key}`,
        });
        req.headers = req.headers || {};
        req.headers['X-Encoded'] = resp.content;
        return req;
      };

      const result = await run(
        {
          authentication: {
            type: 'custom',
            fields: [{ key: 'api_key' }],
          },
          beforeRequest: [beforeRequest],
        },
        { api_key: 'plain-key' },
      );

      capturedFetchUrl.should.eql(
        'https://encoder.example.com/encode/plain-key',
      );
      result.template.headers['X-Encoded'].should.eql('encoded-plain-key');
    });
  });
});
