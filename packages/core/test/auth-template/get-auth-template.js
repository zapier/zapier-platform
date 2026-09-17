'use strict';

const should = require('should');

const getAuthTemplate = require('../../src/auth-template/get-auth-template');

const buildInput = (compiledApp, eventBundle = {}) => ({
  bundle: eventBundle,
  _zapier: {
    app: compiledApp,
    event: { bundle: eventBundle },
    promises: [],
    logger: () => Promise.resolve(),
    logBuffer: [],
    whatHappened: [],
  },
});

const run = (compiledApp) =>
  getAuthTemplate(compiledApp, buildInput(compiledApp));

const STUB_TEST = { url: 'https://example.com' };

// Set variables on process.env for fn, then restore. Simulates the AppVersion
// env being loaded during production capture (local invoke doesn't load it).
const withStubbedEnv = async (vars, fn) => {
  const saved = new Map();
  for (const [key, value] of Object.entries(vars)) {
    saved.set(
      key,
      Object.prototype.hasOwnProperty.call(process.env, key)
        ? process.env[key]
        : undefined,
    );
    process.env[key] = value;
  }
  try {
    return await fn();
  } finally {
    for (const [key, prior] of saved) {
      if (prior === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = prior;
      }
    }
  }
};

describe('getAuthTemplate', () => {
  describe('early returns', () => {
    it('returns supported with empty template when no authentication', async () => {
      const result = await run({});
      result.should.deepEqual({
        supported: true,
        authType: null,
        source: 'none',
        template: {},
      });
    });

    it('returns unsupported for digest auth', async () => {
      const result = await run({
        authentication: { type: 'digest', test: STUB_TEST },
      });
      result.should.deepEqual({
        supported: false,
        reason: 'digest',
        authType: 'digest',
      });
    });

    it('returns unsupported for basic auth', async () => {
      // addBasicAuthHeader base64-encodes username:password, consuming
      // placeholders. Our template format can't express base64-at-render-time,
      // so basic auth is short-circuited.
      const result = await run({
        authentication: { type: 'basic', test: STUB_TEST },
      });
      result.should.deepEqual({
        supported: false,
        reason: 'basic',
        authType: 'basic',
      });
    });
  });

  describe('Step 1: requestTemplate-only path', () => {
    it('returns the requestTemplate when it has an Authorization header', async () => {
      const result = await run({
        authentication: {
          type: 'oauth2',
          test: STUB_TEST,
          fields: [{ key: 'access_token' }],
        },
        requestTemplate: {
          headers: { Authorization: 'Bearer {{bundle.authData.access_token}}' },
        },
      });
      result.supported.should.be.true();
      result.source.should.eql('requestTemplate');
      result.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.access_token}}',
      );
    });

    it('detects auth content via auth-like header name even without placeholders', async () => {
      const result = await run({
        authentication: {
          type: 'custom',
          test: STUB_TEST,
          fields: [{ key: 'api_key' }],
        },
        requestTemplate: {
          headers: { 'X-Api-Key': '{{bundle.authData.api_key}}' },
        },
      });
      result.supported.should.be.true();
      result.source.should.eql('requestTemplate');
      result.template.headers['X-Api-Key'].should.eql(
        '{{bundle.authData.api_key}}',
      );
    });

    it('returns the requestTemplate when it sets auth params', async () => {
      const result = await run({
        authentication: {
          type: 'custom',
          test: STUB_TEST,
          fields: [{ key: 'api_key' }],
        },
        requestTemplate: {
          params: { api_key: '{{bundle.authData.api_key}}' },
        },
      });
      result.supported.should.be.true();
      result.source.should.eql('requestTemplate');
      result.template.params.api_key.should.eql('{{bundle.authData.api_key}}');
    });

    it('falls through when requestTemplate only contains non-auth headers', async () => {
      const result = await run({
        authentication: {
          type: 'custom',
          test: {
            url: 'https://example.com',
            headers: { 'X-Api-Key': '{{bundle.authData.api_key}}' },
          },
          fields: [{ key: 'api_key' }],
        },
        requestTemplate: {
          headers: { Accept: 'application/json' },
        },
      });
      result.supported.should.be.true();
      result.source.should.eql('authentication.test');
      result.template.headers.should.have.property('X-Api-Key');
    });

    it('detects auth content via apikey substring in header name (no dash)', async () => {
      const result = await run({
        authentication: {
          type: 'custom',
          test: STUB_TEST,
          fields: [{ key: 'apikey' }],
        },
        requestTemplate: {
          headers: { 'X-Apikey': 'literal-no-curlies' },
        },
      });
      result.supported.should.be.true();
      result.source.should.eql('requestTemplate');
      result.template.headers['X-Apikey'].should.eql('literal-no-curlies');
    });

    it('detects auth content via token substring in header name', async () => {
      const result = await run({
        authentication: {
          type: 'oauth2',
          test: STUB_TEST,
          fields: [{ key: 'access_token' }],
        },
        requestTemplate: {
          headers: { 'X-Access-Token': 'literal-no-curlies' },
        },
      });
      result.supported.should.be.true();
      result.source.should.eql('requestTemplate');
      result.template.headers['X-Access-Token'].should.eql(
        'literal-no-curlies',
      );
    });
  });

  describe('Step 2: beforeRequest pipeline', () => {
    it('captures auth headers added by a beforeRequest function', async () => {
      const beforeRequest = (req, z, bundle) => {
        req.headers = req.headers || {};
        req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
        return req;
      };
      const result = await run({
        authentication: {
          type: 'oauth2',
          test: STUB_TEST,
          fields: [{ key: 'access_token' }],
        },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.true();
      result.source.should.eql('authentication.test');
      result.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.access_token}}',
      );
    });

    it('accepts beforeRequest as a single function (not an array)', async () => {
      const beforeRequest = (req, z, bundle) => {
        req.headers = req.headers || {};
        req.headers['X-Api-Key'] = bundle.authData.api_key;
        return req;
      };
      const result = await run({
        authentication: {
          type: 'custom',
          test: STUB_TEST,
          fields: [{ key: 'api_key' }],
        },
        beforeRequest,
      });
      result.supported.should.be.true();
      result.source.should.eql('authentication.test');
      result.template.headers['X-Api-Key'].should.eql(
        '{{bundle.authData.api_key}}',
      );
    });

    it('captures beforeRequest auth even when requestTemplate is also defined', async () => {
      // prepareRequest merges requestTemplate into the captured request, so
      // both contributions end up in the template.
      const beforeRequest = (req, z, bundle) => {
        req.headers = req.headers || {};
        req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
        return req;
      };
      const result = await run({
        authentication: {
          type: 'oauth2',
          test: STUB_TEST,
          fields: [{ key: 'access_token' }],
        },
        requestTemplate: {
          headers: { 'X-Tenant': '{{bundle.authData.tenant}}' },
        },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.true();
      result.source.should.eql('authentication.test');
      result.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.access_token}}',
      );
      result.template.headers['X-Tenant'].should.eql(
        '{{bundle.authData.tenant}}',
      );
    });

    it('returns beforeRequest_not_static when beforeRequest branches on undeclared authData', async () => {
      const beforeRequest = (req, z, bundle) => {
        req.headers = req.headers || {};
        if (bundle.authData.use_secondary) {
          req.headers.Authorization = `Bearer ${bundle.authData.secondary_token}`;
        } else {
          req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
        }
        return req;
      };
      const result = await run({
        authentication: {
          type: 'oauth2',
          fields: [{ key: 'access_token' }],
        },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.false();
      result.reason.should.eql('beforeRequest_not_static');
    });

    it('returns beforeRequest_not_static when beforeRequest branches on the URL', async () => {
      const beforeRequest = (req, z, bundle) => {
        req.headers = req.headers || {};
        if (req.url.includes('/admin/')) {
          req.headers.Authorization = `Bearer ${bundle.authData.admin_token}`;
        } else {
          req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
        }
        return req;
      };
      const result = await run({
        authentication: {
          type: 'oauth2',
          fields: [{ key: 'access_token' }, { key: 'admin_token' }],
        },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.false();
      result.reason.should.eql('beforeRequest_not_static');
    });

    it('returns beforeRequest_error when beforeRequest throws and no auth.test', async () => {
      const beforeRequest = () => {
        throw new Error('boom');
      };
      const result = await run({
        authentication: {
          type: 'custom',
          fields: [{ key: 'api_key' }],
        },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.false();
      result.reason.should.eql('beforeRequest_error');
    });

    it('returns auth_fields_consumed when beforeRequest consumes placeholders by encoding', async () => {
      // base64-encoding patterns destroy placeholder strings — the original
      // auth fields are consumed before reaching the captured request.
      const beforeRequest = (req, z, bundle) => {
        req.headers = req.headers || {};
        const encoded = Buffer.from(
          `${bundle.authData.api_key}:${bundle.authData.api_secret}`,
        ).toString('base64');
        req.headers.Authorization = `Custom ${encoded}`;
        return req;
      };
      const result = await run({
        authentication: {
          type: 'custom',
          fields: [{ key: 'api_key' }, { key: 'api_secret' }],
        },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.false();
      result.reason.should.eql('auth_fields_consumed');
    });

    it('resolves an undeclared process.env var to undefined so a || falls through to authData', async () => {
      // Procore shape: `process.env.ACCESS_TOKEN || bundle.authData.access_token`.
      // ACCESS_TOKEN is undeclared, so the || must reach the authData placeholder.
      const beforeRequest = (req, z, bundle) => {
        req.headers = req.headers || {};
        req.headers.Authorization = `Bearer ${
          process.env.ACCESS_TOKEN || bundle.authData.access_token
        }`;
        return req;
      };
      const result = await run({
        authentication: {
          type: 'oauth2',
          test: STUB_TEST,
          fields: [{ key: 'access_token' }],
        },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.true();
      result.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.access_token}}',
      );
    });

    it('omits a header whose value is an undeclared process.env var', async () => {
      // PushPress shape: an undeclared process.env value on the company-id header
      // resolves to undefined and drops out of the serialized template.
      const beforeRequest = (req, z, bundle) => {
        req.headers = req.headers || {};
        req.headers['api-key'] = bundle.authData.apiKey;
        req.headers['company-id'] = process.env.PUSHPRESS_COMPANY_ID;
        return req;
      };
      const result = await run({
        authentication: {
          type: 'custom',
          test: STUB_TEST,
          fields: [{ key: 'apiKey' }],
        },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.true();
      result.template.headers['api-key'].should.eql(
        '{{bundle.authData.apiKey}}',
      );
      // undefined-valued headers drop when the template is serialized to JSON.
      const serialized = JSON.parse(JSON.stringify(result.template));
      serialized.headers.should.not.have.property('company-id');
    });

    it('keeps a declared server-side env var and stays supported', async () => {
      // A declared value is present in process.env during capture, so the proxy
      // returns it unchanged; the fix only affects undeclared vars.
      const beforeRequest = (req, z, bundle) => {
        req.headers = req.headers || {};
        req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
        req.headers['X-Region'] = process.env.SERVER_REGION;
        return req;
      };
      const result = await withStubbedEnv({ SERVER_REGION: 'us-east-1' }, () =>
        run({
          authentication: {
            type: 'oauth2',
            test: STUB_TEST,
            fields: [{ key: 'access_token' }],
          },
          beforeRequest: [beforeRequest],
        }),
      );
      result.supported.should.be.true();
      result.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.access_token}}',
      );
      result.template.headers['X-Region'].should.eql('us-east-1');
    });

    it('flags auth_fields_consumed when declared fields are gone but a declared process.env value survives', async () => {
      // Declared auth fields are consumed by base64 encoding, but a declared
      // server-side env value survives in another header (not an auth placeholder).
      const beforeRequest = (req, z, bundle) => {
        req.headers = req.headers || {};
        const encoded = Buffer.from(
          `${bundle.authData.api_key}:${bundle.authData.api_secret}`,
        ).toString('base64');
        req.headers.Authorization = `Custom ${encoded}`;
        req.headers['X-App'] = `${process.env.APP_ID}`;
        return req;
      };
      const result = await withStubbedEnv({ APP_ID: 'app-123' }, () =>
        run({
          authentication: {
            type: 'custom',
            test: STUB_TEST,
            fields: [{ key: 'api_key' }, { key: 'api_secret' }],
          },
          beforeRequest: [beforeRequest],
        }),
      );
      result.supported.should.be.false();
      result.reason.should.eql('auth_fields_consumed');
    });

    it('falls through to test object when beforeRequest captures no auth placeholders', async () => {
      // BR adds a non-auth header (no placeholder). Step 2 falls through
      // because auth.test exists. Step 3 captures auth from the test object.
      const beforeRequest = (req) => {
        req.headers = req.headers || {};
        req.headers['X-Marker'] = 'static';
        return req;
      };
      const result = await run({
        authentication: {
          type: 'custom',
          fields: [{ key: 'api_key' }],
          test: {
            url: 'https://example.com',
            headers: { 'X-Api-Key': '{{bundle.authData.api_key}}' },
          },
        },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.true();
      result.source.should.eql('authentication.test');
      result.template.headers['X-Api-Key'].should.eql(
        '{{bundle.authData.api_key}}',
      );
    });

    it('falls through to test function when beforeRequest is URL-conditional', async () => {
      // BR branches on URL — Step 2 detects URL divergence, falls through.
      // Step 4 (test function) doesn't run URL probes, so the testFn's real
      // URL produces a deterministic capture.
      const beforeRequest = (req, z, bundle) => {
        req.headers = req.headers || {};
        if (req.url.includes('/admin/')) {
          req.headers.Authorization = `Bearer ${bundle.authData.admin_token}`;
        } else {
          req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
        }
        return req;
      };
      const result = await run({
        authentication: {
          type: 'oauth2',
          fields: [
            { key: 'access_token' },
            { key: 'admin_token' },
            { key: 'api_key' },
          ],
          test: async (z, bundle) =>
            z.request({
              url: 'https://api.example.com/data',
              headers: { 'X-Inline': bundle.authData.api_key },
            }),
        },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.true();
      result.source.should.eql('authentication.test');
      result.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.access_token}}',
      );
      result.template.headers['X-Inline'].should.eql(
        '{{bundle.authData.api_key}}',
      );
    });
  });

  describe('Step 3: authentication.test as an object', () => {
    it('returns the test object headers when no beforeRequest', async () => {
      const result = await run({
        authentication: {
          type: 'custom',
          test: {
            url: 'https://example.com',
            headers: { 'X-Api-Key': '{{bundle.authData.api_key}}' },
          },
          fields: [{ key: 'api_key' }],
        },
      });
      result.supported.should.be.true();
      result.source.should.eql('authentication.test');
      result.template.headers['X-Api-Key'].should.eql(
        '{{bundle.authData.api_key}}',
      );
    });

    it('only merges params with auth placeholders, dropping test-only literals', async () => {
      // Test objects commonly carry non-auth markers (e.g., diagnostic flags).
      // Those must not leak into the rendered auth template.
      const beforeRequest = (req, z, bundle) => {
        req.headers = req.headers || {};
        req.headers['X-Primary'] = bundle.authData.primary_key;
        return req;
      };
      const result = await run({
        authentication: {
          type: 'custom',
          test: {
            url: 'https://example.com',
            headers: { 'X-Secondary': '{{bundle.authData.secondary_key}}' },
            params: {
              alt_key: '{{bundle.authData.alt_key}}',
              from_test: 'true',
            },
          },
          fields: [
            { key: 'primary_key' },
            { key: 'secondary_key' },
            { key: 'alt_key' },
          ],
        },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.true();
      result.source.should.eql('authentication.test');
      result.template.headers['X-Primary'].should.eql(
        '{{bundle.authData.primary_key}}',
      );
      result.template.headers['X-Secondary'].should.eql(
        '{{bundle.authData.secondary_key}}',
      );
      result.template.params.alt_key.should.eql('{{bundle.authData.alt_key}}');
      result.template.params.should.not.have.property('from_test');
    });

    it('captures requestTemplate params whose key differs from the authData field', async () => {
      const beforeRequest = (req, z, bundle) => {
        req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
        return req;
      };
      const result = await run({
        authentication: {
          type: 'oauth2',
          test: STUB_TEST,
          fields: [{ key: 'access_token' }],
        },
        requestTemplate: {
          params: { api_key: '{{bundle.authData.access_token}}' },
        },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.true();
      result.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.access_token}}',
      );
      result.template.params.api_key.should.eql(
        '{{bundle.authData.access_token}}',
      );
    });

    it('captures params when test URL embeds an authData field in the hostname', async () => {
      const result = await run({
        authentication: {
          type: 'custom',
          fields: [{ key: 'subdomain' }],
          test: {
            url: 'https://{{bundle.authData.subdomain}}.example.com/me',
            headers: { 'X-Sub': '{{bundle.authData.subdomain}}' },
            params: { tenant: '{{bundle.authData.subdomain}}' },
          },
        },
      });
      result.supported.should.be.true();
      result.template.headers['X-Sub'].should.eql(
        '{{bundle.authData.subdomain}}',
      );
      result.template.params.tenant.should.eql('{{bundle.authData.subdomain}}');
    });

    it('returns beforeRequest_error when the pipeline throws on the test object', async () => {
      const beforeRequest = () => {
        throw new Error('boom');
      };
      const result = await run({
        authentication: {
          type: 'custom',
          fields: [{ key: 'api_key' }],
          test: {
            url: 'https://example.com',
            headers: { 'X-Api-Key': '{{bundle.authData.api_key}}' },
          },
        },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.false();
      result.reason.should.eql('beforeRequest_error');
    });

    it('returns beforeRequest_not_static when authData branching is detected at Step 3', async () => {
      const beforeRequest = (req, z, bundle) => {
        req.headers = req.headers || {};
        if (bundle.authData.use_alt) {
          req.headers.Authorization = `Bearer ${bundle.authData.alt_token}`;
        } else {
          req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
        }
        return req;
      };
      const result = await run({
        authentication: {
          type: 'oauth2',
          fields: [{ key: 'access_token' }],
          test: { url: 'https://example.com' },
        },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.false();
      result.reason.should.eql('beforeRequest_not_static');
    });

    it('returns beforeRequest_not_static when URL branching is detected at Step 3', async () => {
      const beforeRequest = (req, z, bundle) => {
        req.headers = req.headers || {};
        if (req.url.includes('/admin/')) {
          req.headers.Authorization = `Bearer ${bundle.authData.admin_token}`;
        } else {
          req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
        }
        return req;
      };
      const result = await run({
        authentication: {
          type: 'oauth2',
          fields: [{ key: 'access_token' }, { key: 'admin_token' }],
          test: { url: 'https://example.com' },
        },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.false();
      result.reason.should.eql('beforeRequest_not_static');
    });

    it('returns auth_fields_consumed when nothing in test object or beforeRequest references authData', async () => {
      // Test object has no auth-relevant content; BR adds only literals.
      // Step 3's pipeline captures a request with no placeholders.
      const beforeRequest = (req) => {
        req.headers = req.headers || {};
        req.headers['X-Marker'] = 'static';
        return req;
      };
      const result = await run({
        authentication: {
          type: 'custom',
          fields: [{ key: 'api_key' }],
          test: { url: 'https://example.com' },
        },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.false();
      result.reason.should.eql('auth_fields_consumed');
    });
  });

  describe('Step 4: authentication.test as a function (inline auth)', () => {
    it('captures inline auth set in z.request config', async () => {
      // Inline-auth pattern: no beforeRequest, no requestTemplate. Auth lives
      // in each operation's z.request call config.
      const result = await run({
        authentication: {
          type: 'custom',
          fields: [{ key: 'api_key' }],
          test: async (z, bundle) => {
            const response = await z.request({
              url: 'https://example.com/me',
              headers: { 'X-Api-Key': bundle.authData.api_key },
            });
            return response.data;
          },
        },
      });
      result.supported.should.be.true();
      result.source.should.eql('authentication.test');
      result.template.headers['X-Api-Key'].should.eql(
        '{{bundle.authData.api_key}}',
      );
    });

    it('still captures the prepared request when the test function throws after z.request', async () => {
      // Test functions often parse the response (resp.data.user.email) and
      // crash on the empty stub. The request was already captured.
      const result = await run({
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
      });
      result.supported.should.be.true();
      result.source.should.eql('authentication.test');
      result.template.headers['X-Api-Key'].should.eql(
        '{{bundle.authData.api_key}}',
      );
    });

    it('returns test_function_not_static when test function branches on undeclared authData', async () => {
      const result = await run({
        authentication: {
          type: 'custom',
          fields: [{ key: 'api_key' }],
          test: async (z, bundle) => {
            const headers = bundle.authData.use_alt
              ? { 'X-Alt-Key': bundle.authData.alt_key }
              : { 'X-Api-Key': bundle.authData.api_key };
            return z.request({ url: 'https://example.com/me', headers });
          },
        },
      });
      result.supported.should.be.false();
      result.reason.should.eql('test_function_not_static');
    });

    it('returns auth_fields_consumed when the function makes a request without auth placeholders', async () => {
      const result = await run({
        authentication: {
          type: 'custom',
          fields: [{ key: 'api_key' }],
          test: async (z) =>
            z.request({
              url: 'https://example.com/me',
              headers: { 'X-Static': 'not-an-auth-field' },
            }),
        },
      });
      result.supported.should.be.false();
      result.reason.should.eql('auth_fields_consumed');
    });

    it('falls back to source: none when the function never makes a request and no beforeRequest', async () => {
      const result = await run({
        authentication: {
          type: 'custom',
          fields: [{ key: 'api_key' }],
          test: async () => ({ ok: true }),
        },
      });
      result.supported.should.be.true();
      result.source.should.eql('none');
      result.template.should.deepEqual({});
    });

    it('uses the beforeRequest template when test function makes no request', async () => {
      // BR captures auth; test function exists but never calls z.request.
      // Falls through to the BR template.
      const beforeRequest = (req, z, bundle) => {
        req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
        return req;
      };
      const result = await run({
        authentication: {
          type: 'oauth2',
          fields: [{ key: 'access_token' }],
          test: async () => ({ ok: true }),
        },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.true();
      result.source.should.eql('beforeRequest');
      result.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.access_token}}',
      );
    });

    it('prefers the test function template when it adds per-operation auth', async () => {
      // Some apps add per-operation auth in the test function on top of BR's
      // contribution. The test function's template is a strict superset.
      const beforeRequest = (req, z, bundle) => {
        req.headers = req.headers || {};
        req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
        return req;
      };
      const result = await run({
        authentication: {
          type: 'oauth2',
          fields: [{ key: 'access_token' }, { key: 'api_key' }],
          test: async (z, bundle) =>
            z.request({
              url: 'https://example.com/me',
              headers: { 'X-Api-Key': bundle.authData.api_key },
            }),
        },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.true();
      result.source.should.eql('authentication.test');
      result.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.access_token}}',
      );
      result.template.headers['X-Api-Key'].should.eql(
        '{{bundle.authData.api_key}}',
      );
    });

    it('returns test_function_error when test function throws before z.request and beforeRequest also failed', async () => {
      const beforeRequest = () => {
        throw new Error('br boom');
      };
      const result = await run({
        authentication: {
          type: 'custom',
          fields: [{ key: 'api_key' }],
          test: async () => {
            throw new Error('test fn boom');
          },
        },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.false();
      result.reason.should.eql('test_function_error');
    });

    it('returns test_function_no_request when test function makes no z.request and beforeRequest failed', async () => {
      const beforeRequest = () => {
        throw new Error('br boom');
      };
      const result = await run({
        authentication: {
          type: 'custom',
          fields: [{ key: 'api_key' }],
          test: async () => ({ ok: true }),
        },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.false();
      result.reason.should.eql('test_function_no_request');
    });
  });

  describe('standard placeholder fields per auth type', () => {
    // Basic auth is short-circuited before placeholder injection; see
    // "early returns > returns unsupported for basic auth".

    it('oauth2 gets access_token without declaration', async () => {
      const beforeRequest = (req, z, bundle) => {
        if (bundle.authData.access_token) {
          req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
        }
        return req;
      };
      const result = await run({
        authentication: { type: 'oauth2', test: STUB_TEST },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.true();
      result.source.should.eql('authentication.test');
      result.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.access_token}}',
      );
    });

    it('oauth1 gets oauth_token and oauth_token_secret placeholders', async () => {
      const beforeRequest = (req, z, bundle) => {
        req.headers = req.headers || {};
        req.headers['X-Token'] = bundle.authData.oauth_token;
        req.headers['X-Secret'] = bundle.authData.oauth_token_secret;
        return req;
      };
      const result = await run({
        authentication: { type: 'oauth1', test: STUB_TEST },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.true();
      result.source.should.eql('authentication.test');
      result.template.headers['X-Token'].should.eql(
        '{{bundle.authData.oauth_token}}',
      );
      result.template.headers['X-Secret'].should.eql(
        '{{bundle.authData.oauth_token_secret}}',
      );
    });

    it('custom with sendCode gets a code placeholder', async () => {
      const beforeRequest = (req, z, bundle) => {
        req.headers = req.headers || {};
        req.headers['X-Code'] = bundle.authData.code;
        return req;
      };
      const result = await run({
        authentication: {
          type: 'custom',
          test: STUB_TEST,
          customConfig: { sendCode: () => {} },
        },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.true();
      result.source.should.eql('authentication.test');
      result.template.headers['X-Code'].should.eql('{{bundle.authData.code}}');
    });

    it('session gets standard token placeholders for all common key names', async () => {
      // Session auth in some integrations stashes its token (or related
      // metadata) under names that aren't declared as auth fields. The
      // session auth flow populates them at runtime; we add placeholders
      // for the common ones observed across real integrations.
      const beforeRequest = (req, z, bundle) => {
        req.headers = req.headers || {};
        req.headers['X-Session-Key'] = bundle.authData.sessionKey;
        req.headers['X-Access-Token'] = bundle.authData.access_token;
        req.headers['X-Access-Camel'] = bundle.authData.accessToken;
        req.headers['X-Token'] = bundle.authData.token;
        req.headers['X-Session-Token'] = bundle.authData.sessionToken;
        req.headers['X-Api-Token'] = bundle.authData.apiToken;
        req.headers['X-PHPSESSID'] = bundle.authData.PHPSESSID;
        return req;
      };
      const result = await run({
        authentication: { type: 'session', test: STUB_TEST },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.true();
      result.source.should.eql('authentication.test');
      result.template.headers['X-Session-Key'].should.eql(
        '{{bundle.authData.sessionKey}}',
      );
      result.template.headers['X-Access-Token'].should.eql(
        '{{bundle.authData.access_token}}',
      );
      result.template.headers['X-Access-Camel'].should.eql(
        '{{bundle.authData.accessToken}}',
      );
      result.template.headers['X-Token'].should.eql(
        '{{bundle.authData.token}}',
      );
      result.template.headers['X-Session-Token'].should.eql(
        '{{bundle.authData.sessionToken}}',
      );
      result.template.headers['X-Api-Token'].should.eql(
        '{{bundle.authData.apiToken}}',
      );
      result.template.headers['X-PHPSESSID'].should.eql(
        '{{bundle.authData.PHPSESSID}}',
      );
    });
  });

  describe('regression: addQueryParams should not see urlProbe behavior', () => {
    it('does not flag URL divergence for middlewares that only set params', async () => {
      // A beforeRequest that only mutates req.params shouldn't trigger the
      // URL probe divergence check (regression: addQueryParams reads
      // url.includes('?') and was perturbed by the probe).
      const beforeRequest = (req, z, bundle) => {
        req.params = req.params || {};
        req.params.api_key = bundle.authData.api_key;
        return req;
      };
      const result = await run({
        authentication: {
          type: 'custom',
          test: STUB_TEST,
          fields: [{ key: 'api_key' }],
        },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.true();
      result.source.should.eql('authentication.test');
      result.template.params.api_key.should.eql('{{bundle.authData.api_key}}');
    });
  });

  describe('two-argument z.request in the test function', () => {
    const oauth2App = (testFn) => ({
      authentication: {
        type: 'oauth2',
        test: testFn,
        fields: [{ key: 'access_token' }],
      },
      beforeRequest: [
        (req, z, bundle) => {
          if (req.withUserToken) {
            req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
          }
          return req;
        },
      ],
    });

    it('honours a flag passed on a single object argument', async () => {
      // createRequestOptions only merges when the first arg is a string; an
      // object first arg is used as-is, matching the real client.
      const testFn = async (z) => {
        const res = await z.request({
          url: 'https://example.com/api/auth.test',
          withUserToken: true,
        });
        return res.data;
      };
      const result = await run(oauth2App(testFn));
      result.supported.should.be.true();
      result.source.should.eql('authentication.test');
      result.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.access_token}}',
      );
    });

    it('honours a flag passed as the second argument', async () => {
      const testFn = async (z) => {
        const res = await z.request('https://example.com/api/auth.test', {
          withUserToken: true,
        });
        return res.data;
      };
      const result = await run(oauth2App(testFn));
      result.supported.should.be.true();
      result.source.should.eql('authentication.test');
      result.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.access_token}}',
      );
    });

    it('merges headers supplied via the second argument', async () => {
      const testFn = async (z) => {
        const res = await z.request('https://example.com/me', {
          headers: { 'X-Api-Key': '{{bundle.authData.api_key}}' },
        });
        return res.data;
      };
      const result = await run({
        authentication: {
          type: 'custom',
          test: testFn,
          fields: [{ key: 'api_key' }],
        },
      });
      result.supported.should.be.true();
      result.template.headers['X-Api-Key'].should.eql(
        '{{bundle.authData.api_key}}',
      );
    });
  });

  describe('customRequestProperties', () => {
    // customRequestProperties arrives on the bundle from the request client. It
    // must reach the app's beforeRequest middleware, but its values are
    // per-connection and must never appear in the emitted template.
    const runWithCustom = (compiledApp, customRequestProperties) =>
      getAuthTemplate(
        compiledApp,
        buildInput(compiledApp, { customRequestProperties }),
      );

    it('exposes custom properties to beforeRequest', async () => {
      let seen;
      const beforeRequest = (req, z, bundle) => {
        seen = req.subdomain;
        req.headers = req.headers || {};
        req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
        return req;
      };
      const result = await runWithCustom(
        {
          authentication: {
            type: 'oauth2',
            test: STUB_TEST,
            fields: [{ key: 'access_token' }],
          },
          beforeRequest: [beforeRequest],
        },
        { subdomain: 'acme' },
      );
      seen.should.eql('acme');
      result.supported.should.be.true();
      result.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.access_token}}',
      );
      // The custom property itself is not part of the template
      should(result.template.subdomain).be.undefined();
      should(result.template.headers.subdomain).be.undefined();
    });

    it('does not let custom headers override the request headers', async () => {
      // The request's own headers take precedence: custom headers neither
      // replace nor merge into them, so nothing custom reaches the request.
      let seen;
      const beforeRequest = (req, z, bundle) => {
        seen = { ...req.headers };
        req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
        return req;
      };
      const result = await runWithCustom(
        {
          authentication: {
            type: 'oauth2',
            test: STUB_TEST,
            fields: [{ key: 'access_token' }],
          },
          beforeRequest: [beforeRequest],
        },
        { headers: { 'X-Tenant': 'acme-corp' } },
      );
      should(seen['X-Tenant']).be.undefined();
      result.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.access_token}}',
      );
      JSON.stringify(result.template).should.not.match(/acme-corp/);
    });

    it('keeps a custom-keyed header whose value middleware rewrote', async () => {
      // The value changed, so it's the middleware's contribution now, not
      // the raw per-connection value — it belongs in the template.
      const beforeRequest = (req, z, bundle) => {
        req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
        return req;
      };
      const result = await runWithCustom(
        {
          authentication: {
            type: 'oauth2',
            test: STUB_TEST,
            fields: [{ key: 'access_token' }],
          },
          beforeRequest: [beforeRequest],
        },
        { headers: { Authorization: 'Bearer raw-secret' } },
      );
      result.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.access_token}}',
      );
    });

    it("preserves an auth.test object's own headers against custom headers", async () => {
      // The auth.test request declares Accept; a custom headers object must
      // not displace it. Defaults win, so Accept survives and X-Tenant
      // never arrives.
      let seen;
      const beforeRequest = (req, z, bundle) => {
        seen = { ...req.headers };
        req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
        return req;
      };
      const result = await runWithCustom(
        {
          authentication: {
            type: 'oauth2',
            test: {
              url: 'https://example.com',
              headers: { Accept: 'application/vnd.v2+json' },
            },
            fields: [{ key: 'access_token' }],
          },
          beforeRequest: [beforeRequest],
        },
        { headers: { 'X-Tenant': 'acme' } },
      );
      seen.Accept.should.eql('application/vnd.v2+json');
      should(seen['X-Tenant']).be.undefined();
      result.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.access_token}}',
      );
    });

    it('does not let custom params override the request params', async () => {
      let seen;
      const beforeRequest = (req, z, bundle) => {
        seen = { ...req.params };
        req.params.api_key = bundle.authData.api_key;
        return req;
      };
      const result = await runWithCustom(
        {
          authentication: {
            type: 'custom',
            test: STUB_TEST,
            fields: [{ key: 'api_key' }],
          },
          beforeRequest: [beforeRequest],
        },
        { params: { region: 'us-east-1' } },
      );
      should(seen.region).be.undefined();
      result.template.params.api_key.should.eql('{{bundle.authData.api_key}}');
      JSON.stringify(result.template).should.not.match(/us-east-1/);
    });

    it('does not let custom properties override url or plumbing', async () => {
      let seenUrl;
      const beforeRequest = (req, z, bundle) => {
        seenUrl = req.url;
        req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
        return req;
      };
      const result = await runWithCustom(
        {
          authentication: {
            type: 'oauth2',
            test: { url: 'https://api.example.com/me' },
            fields: [{ key: 'access_token' }],
          },
          beforeRequest: [beforeRequest],
        },
        { url: 'https://evil.example.com', merge: false },
      );
      seenUrl.should.eql('https://api.example.com/me');
      result.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.access_token}}',
      );
    });

    it('exposes custom properties from authentication.test function in beforeRequest', async () => {
      const testFn = async (z, bundle) => {
        const res = await z.request({
          url: 'https://api.example.com/me',
          headers: { Authorization: `Bearer ${bundle.authData.access_token}` },
          subdomain: 'acme', // custom request property passed in authentication.test
        });
        return res.data;
      };
      let seen;
      const beforeRequest = (req) => {
        seen = req.subdomain;
        return req;
      };

      const compiledApp = {
        authentication: {
          type: 'oauth2',
          test: testFn,
          fields: [{ key: 'access_token' }],
        },
        beforeRequest: [beforeRequest],
      };
      const result = await getAuthTemplate(
        compiledApp,
        buildInput(compiledApp),
      );

      seen.should.eql('acme');
      result.supported.should.be.true();
      result.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.access_token}}',
      );
      should(result.template.subdomain).be.undefined();
    });

    it('keeps custom body, form, and json out of the template', async () => {
      // sugarBody moves req.form and req.json into req.body, so they reach
      // the template by the same route a custom body would.
      for (const custom of [
        { body: { tenant: 'acme-corp' }, allowGetBody: true },
        { json: { tenant: 'acme-corp' }, allowGetBody: true },
        { form: { tenant: 'acme-corp' }, allowGetBody: true },
      ]) {
        const result = await runWithCustom(
          {
            authentication: {
              type: 'custom',
              // A test function that makes no request, so the middleware-path
              // template is what gets returned.
              test: async () => ({}),
              fields: [{ key: 'api_key' }],
            },
            beforeRequest: [
              (req, z, bundle) => {
                req.headers['X-Api-Key'] = bundle.authData.api_key;
                return req;
              },
            ],
          },
          custom,
        );

        result.supported.should.be.true();
        result.template.headers['X-Api-Key'].should.eql(
          '{{bundle.authData.api_key}}',
        );
        JSON.stringify(result.template).should.not.match(/acme-corp/);
      }
    });

    it('behaves exactly as before when the bundle has no custom properties', async () => {
      const app = {
        authentication: {
          type: 'oauth2',
          test: STUB_TEST,
          fields: [{ key: 'access_token' }],
        },
        beforeRequest: [
          (req, z, bundle) => {
            req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
            return req;
          },
        ],
      };
      const withEmpty = await runWithCustom(app, {});
      const withNone = await run(app);
      withEmpty.should.deepEqual(withNone);
    });
  });

  describe('fallback when nothing captures auth', () => {
    it('returns supported: true with empty template when there is no path to capture auth', async () => {
      // Auth declared but no beforeRequest, no requestTemplate, and no
      // auth.test. We fall through everything and return source: none.
      const result = await run({
        authentication: { type: 'custom', fields: [{ key: 'api_key' }] },
      });
      should(result.supported).be.true();
      result.source.should.eql('none');
      result.template.should.deepEqual({});
    });
  });

  describe('body extraction', () => {
    // Regression: Resend's auth test sends an email, and Relay was merging
    // that payload into every proxied request.
    it('excludes an auth-test body that carries no auth placeholder', async () => {
      const result = await run({
        authentication: {
          type: 'custom',
          fields: [{ key: 'api_key' }],
          test: {
            url: 'https://api.resend.com/emails',
            method: 'POST',
            headers: { Authorization: 'Bearer {{bundle.authData.api_key}}' },
            body: {
              from: 'zapier@resend.dev', // pii:allow
              to: 'delivered@resend.dev', // pii:allow
              subject: 'Zapier Auth Check',
            },
          },
        },
      });
      result.supported.should.be.true();
      result.template.should.deepEqual({
        headers: { Authorization: 'Bearer {{bundle.authData.api_key}}' },
      });
    });

    it('keeps an auth-test body that carries an auth placeholder', async () => {
      const result = await run({
        authentication: {
          type: 'custom',
          fields: [{ key: 'api_key' }],
          test: {
            url: 'https://api.example.com/login',
            method: 'POST',
            body: { apiKey: '{{bundle.authData.api_key}}', locale: 'en' },
          },
        },
      });
      result.supported.should.be.true();
      result.template.body.should.match(/{{bundle\.authData\.api_key}}/);
      result.template.headers['content-type'].should.match(/application\/json/);
    });

    it('strips transport headers the middleware added', async () => {
      const result = await run({
        authentication: {
          type: 'custom',
          fields: [{ key: 'api_key' }],
          test: {
            url: 'https://api.example.com/me',
            headers: { Authorization: 'Bearer {{bundle.authData.api_key}}' },
          },
        },
      });
      result.template.headers.should.not.have.property('user-agent');
      result.template.headers.should.not.have.property('content-length');
    });
  });

  describe('derived auth params stripped by extractTemplate', () => {
    const crypto = require('crypto');

    const facebookLikeBeforeRequest = (req, z, bundle) => {
      req.headers = req.headers || {};
      req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
      const token = bundle.authData.access_token;
      const time = Math.floor(Date.now() / 1000);
      const appsecretProof = crypto
        .createHmac('sha256', 'test-secret')
        .update(`${token}|${time}`)
        .digest('hex');
      req.params = {
        ...req.params,
        appsecret_proof: appsecretProof,
        appsecret_time: time,
      };
      return req;
    };

    it('returns stripped_derived_params when middleware computes appsecret_proof', async () => {
      const result = await run({
        authentication: {
          type: 'oauth2',
          test: STUB_TEST,
          fields: [{ key: 'access_token' }],
        },
        beforeRequest: [facebookLikeBeforeRequest],
      });
      result.supported.should.be.false();
      result.reason.should.eql('stripped_derived_params');
      result.strippedParams.should.containEql('appsecret_proof');
      result.strippedParams.should.containEql('appsecret_time');
    });

    it('returns stripped_derived_params when auth.test calls z.request through the pipeline', async () => {
      const result = await run({
        authentication: {
          type: 'oauth2',
          fields: [{ key: 'access_token' }],
          test: async (z) =>
            z.request({ url: 'https://graph.facebook.com/me' }),
        },
        beforeRequest: [facebookLikeBeforeRequest],
      });
      result.supported.should.be.false();
      result.reason.should.eql('stripped_derived_params');
      result.strippedParams.should.containEql('appsecret_proof');
    });

    it('stays supported when params use auth placeholders', async () => {
      const beforeRequest = (req, z, bundle) => {
        req.params = req.params || {};
        req.params.api_key = bundle.authData.api_key;
        return req;
      };
      const result = await run({
        authentication: {
          type: 'custom',
          test: STUB_TEST,
          fields: [{ key: 'api_key' }],
        },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.true();
      result.template.params.api_key.should.eql('{{bundle.authData.api_key}}');
    });

    it('does not flag test-only params excluded from capture', async () => {
      const beforeRequest = (req, z, bundle) => {
        req.headers = req.headers || {};
        req.headers['X-Primary'] = bundle.authData.primary_key;
        return req;
      };
      const result = await run({
        authentication: {
          type: 'custom',
          test: {
            url: 'https://example.com',
            headers: { 'X-Secondary': '{{bundle.authData.secondary_key}}' },
            params: {
              alt_key: '{{bundle.authData.alt_key}}',
              from_test: 'true',
            },
          },
          fields: [
            { key: 'primary_key' },
            { key: 'secondary_key' },
            { key: 'alt_key' },
          ],
        },
        beforeRequest: [beforeRequest],
      });
      result.supported.should.be.true();
      result.source.should.eql('authentication.test');
      result.template.params.should.not.have.property('from_test');
    });
  });

  describe('legacy session auth with an empty auth mapping', () => {
    // An empty legacy auth mapping makes the scripting middleware write the
    // whole credential set into the request. Under capture those values are
    // placeholders, so the template names credentials the app may never
    // populate. UpkeepCLIAPI@1.3.0 is the production case.
    const legacyBeforeRequest = (req, z, bundle) =>
      z.legacyScripting.beforeRequest(req, z, bundle);

    const sessionApp = (legacy) => ({
      authentication: {
        type: 'session',
        test: STUB_TEST,
        fields: [{ key: 'username' }, { key: 'password' }],
      },
      legacy,
      beforeRequest: [legacyBeforeRequest],
    });

    it('returns legacy_authdata_dump for header placement', async () => {
      const result = await run(
        sessionApp({ authentication: { mapping: {}, placement: 'header' } }),
      );
      result.supported.should.be.false();
      result.reason.should.eql('legacy_authdata_dump');
    });

    it('returns legacy_authdata_dump for querystring placement', async () => {
      const result = await run(
        sessionApp({
          authentication: { mapping: {}, placement: 'querystring' },
        }),
      );
      result.supported.should.be.false();
      result.reason.should.eql('legacy_authdata_dump');
    });

    it('returns legacy_authdata_dump when legacy.authentication is absent', async () => {
      const result = await run(sessionApp({}));
      result.supported.should.be.false();
      result.reason.should.eql('legacy_authdata_dump');
    });

    it('keeps a legacy session app that declares a real auth mapping', async () => {
      const result = await run(
        sessionApp({
          authentication: {
            mapping: { 'X-Api-Token': '{{token}}' },
            placement: 'header',
          },
        }),
      );
      result.supported.should.be.true();
      result.template.headers['X-Api-Token'].should.eql(
        '{{bundle.authData.token}}',
      );
      result.template.headers.should.not.have.property('password');
    });

    it('keeps an app carrying a legacy block whose middleware never runs', async () => {
      const result = await run({
        authentication: {
          type: 'session',
          test: STUB_TEST,
          fields: [{ key: 'username' }, { key: 'password' }],
        },
        legacy: { authentication: { mapping: {}, placement: 'header' } },
        requestTemplate: {
          headers: {
            username: '{{bundle.authData.username}}',
            password: '{{bundle.authData.password}}',
          },
        },
      });
      result.supported.should.be.true();
      result.source.should.eql('requestTemplate');
    });
  });
  describe('populatedAuthFields (connection shape)', () => {
    // The request client sends the auth field names a connection populated, so
    // the capture reflects the credential branch that connection takes rather
    // than whichever branch won with every schema field placeholdered.
    const runWithShape = (compiledApp, populatedAuthFields) =>
      getAuthTemplate(
        compiledApp,
        buildInput(compiledApp, { populatedAuthFields }),
      );

    // Glean: middleware sets Authorization from api_token, then a second block
    // overwrites it from access_token. With both placeholdered the OAuth
    // branch always won, so API-token connections were served an
    // {{bundle.authData.access_token}} they could not resolve.
    const MULTI_CREDENTIAL_APP = {
      authentication: {
        type: 'custom',
        test: STUB_TEST,
        fields: [
          { key: 'api_token', required: false },
          { key: 'access_token', required: false },
        ],
      },
      beforeRequest: [
        (req, z, bundle) => {
          if (bundle.authData.api_token) {
            req.headers.Authorization = `Bearer ${bundle.authData.api_token}`;
          }
          if (bundle.authData.access_token) {
            req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
            req.headers['X-Auth-Type'] = 'OAUTH';
          }
          return req;
        },
      ],
    };

    it('captures the api-token branch for an api-token connection', async () => {
      const result = await runWithShape(MULTI_CREDENTIAL_APP, ['api_token']);

      result.supported.should.be.true();
      result.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.api_token}}',
      );
      should(result.template.headers['X-Auth-Type']).be.undefined();
    });

    it('captures the oauth branch for an oauth connection', async () => {
      const result = await runWithShape(MULTI_CREDENTIAL_APP, ['access_token']);

      result.supported.should.be.true();
      result.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.access_token}}',
      );
      result.template.headers['X-Auth-Type'].should.eql('OAUTH');
    });

    it('keeps the last-wins branch when a connection has both', async () => {
      const result = await runWithShape(MULTI_CREDENTIAL_APP, [
        'api_token',
        'access_token',
      ]);

      result.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.access_token}}',
      );
    });

    it('falls back to the schema when no shape is sent', async () => {
      // `zapier invoke auth template` has no connection, so it sends no
      // shape: every declared field is placeholdered and the later branch
      // wins. Correct for a single-credential app, best-effort here.
      const result = await getAuthTemplate(
        MULTI_CREDENTIAL_APP,
        buildInput(MULTI_CREDENTIAL_APP),
      );

      result.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.access_token}}',
      );
    });

    it('treats an empty shape as a connection with no credentials', async () => {
      // Not the same as sending no shape at all: nothing is placeholdered, so
      // neither branch is captured and there is no template to share. The
      // connection goes to the per-request render path instead of inheriting
      // another shape's credential.
      const result = await runWithShape(MULTI_CREDENTIAL_APP, []);

      result.supported.should.be.false();
      should(result.template).be.undefined();
    });

    // ChatGPT / OpenAI: organization_id is declared optional, so the template
    // carried OpenAI-Organization unconditionally and connections without an
    // org sent an empty header.
    const OPTIONAL_FIELD_APP = {
      authentication: {
        type: 'custom',
        test: STUB_TEST,
        fields: [
          { key: 'api_key' },
          { key: 'organization_id', required: false },
        ],
      },
      beforeRequest: [
        (req, z, bundle) => {
          req.headers.Authorization = `Bearer ${bundle.authData.api_key}`;
          if (bundle.authData.organization_id) {
            req.headers['OpenAI-Organization'] =
              bundle.authData.organization_id;
          }
          return req;
        },
      ],
    };

    it('omits an optional field the connection did not populate', async () => {
      const result = await runWithShape(OPTIONAL_FIELD_APP, ['api_key']);

      result.supported.should.be.true();
      result.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.api_key}}',
      );
      should(result.template.headers['OpenAI-Organization']).be.undefined();
    });

    it('includes an optional field the connection did populate', async () => {
      const result = await runWithShape(OPTIONAL_FIELD_APP, [
        'api_key',
        'organization_id',
      ]);

      result.template.headers['OpenAI-Organization'].should.eql(
        '{{bundle.authData.organization_id}}',
      );
    });

    it('stays supported when middleware branches on an absent declared field', async () => {
      // The divergence check must treat a declared-but-unpopulated field as
      // genuinely absent. Fabricating a value for it in the proxy run would
      // demote every app with an optional credential to the render path.
      const result = await runWithShape(OPTIONAL_FIELD_APP, ['api_key']);

      result.supported.should.be.true();
      should(result.reason).be.undefined();
    });

    it('still demotes when middleware branches on an undeclared field', async () => {
      // The proxy safety net has to survive: keys outside the schema are
      // unknowns, not known-absent, so branching on one is still non-static.
      const app = {
        authentication: {
          type: 'custom',
          test: STUB_TEST,
          fields: [{ key: 'api_key' }],
        },
        beforeRequest: [
          (req, z, bundle) => {
            req.headers.Authorization = `Bearer ${bundle.authData.api_key}`;
            if (bundle.authData.instance_url) {
              req.headers['X-Instance'] = bundle.authData.instance_url;
            }
            return req;
          },
        ],
      };
      const result = await runWithShape(app, ['api_key']);

      result.supported.should.be.false();
      result.reason.should.eql('beforeRequest_not_static');
    });

    it('applies the shape to oauth2 standard fields', async () => {
      // access_token is placeholdered from the auth type, not from declared
      // fields, so the shape has to reach those too.
      const app = {
        authentication: {
          type: 'oauth2',
          test: STUB_TEST,
          oauth2Config: { autoRefresh: true, refreshAccessToken: () => {} },
        },
        beforeRequest: [
          (req, z, bundle) => {
            req.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
            if (bundle.authData.refresh_token) {
              req.headers['X-Refreshable'] = 'yes';
            }
            return req;
          },
        ],
      };

      const withRefresh = await runWithShape(app, [
        'access_token',
        'refresh_token',
      ]);
      withRefresh.template.headers['X-Refreshable'].should.eql('yes');

      const withoutRefresh = await runWithShape(app, ['access_token']);
      withoutRefresh.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.access_token}}',
      );
      should(withoutRefresh.template.headers['X-Refreshable']).be.undefined();
    });

    it('applies the shape to an auth.test object path', async () => {
      // No beforeRequest: the template comes from the test request itself.
      const app = {
        authentication: {
          type: 'custom',
          fields: [{ key: 'api_key' }, { key: 'organization_id' }],
          test: {
            url: 'https://example.com',
            headers: {
              Authorization: 'Bearer {{bundle.authData.api_key}}',
              'OpenAI-Organization': '{{bundle.authData.organization_id}}',
            },
          },
        },
      };
      const result = await runWithShape(app, ['api_key']);

      result.supported.should.be.true();
      result.template.headers.Authorization.should.eql(
        'Bearer {{bundle.authData.api_key}}',
      );
      // The literal curly in the test snapshot is not produced by a
      // placeholder, so restricting the placeholders cannot remove it: the
      // entry itself has to be dropped, or every connection of this shape
      // sends the phantom header.
      should(result.template.headers['OpenAI-Organization']).be.undefined();
    });
  });
});
