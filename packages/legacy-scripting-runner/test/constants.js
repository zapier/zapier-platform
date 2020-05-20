const AUTH_JSON_SERVER_URL =
  process.env.AUTH_JSON_SERVER_URL ||
  'https://auth-json-server.zapier-staging.com';

const HTTPBIN_URL =
  process.env.HTTPBIN_URL || 'https://httpbin.zapier-tooling.com';

module.exports = {
  AUTH_JSON_SERVER_URL,
  HTTPBIN_URL,
};
