'use strict';

const _processArgs = process.argv.join(' ');
const IS_TESTING =
  _processArgs.indexOf('mocha') > 0 ||
  _processArgs.indexOf('jest') > 0 ||
  (process.env.NODE_ENV || '').startsWith('test');

const KILL_MIN_LIMIT = 250;
const KILL_MAX_LIMIT = 450 * 1000 * 1000;

const RESPONSE_SIZE_LIMIT = 6291456;

const HYDRATE_DIRECTIVE_HOIST = '$HOIST$';

const RENDER_ONLY_METHODS = [
  'authentication.oauth2Config.authorizeUrl',
  'authentication.oauth1Config.authorizeUrl',
];

const REQUEST_OBJECT_SHORTHAND_OPTIONS = { isShorthand: true, replace: true };

const DEFAULT_LOGGING_HTTP_ENDPOINT = 'https://httplogger.zapier.com/input';
const DEFAULT_LOGGING_HTTP_API_KEY = 'R24hzu86v3jntwtX2DtYECeWAB'; // It's ok, this isn't PROD

const SENSITIVE_KEYS = [
  'api_key',
  'apikey',
  'auth',
  'passwd',
  'password',
  'secret',
  'signature',
  'token',
];

const SAFE_LOG_KEYS = [
  'account_id',
  'api_title',
  'app_cli_id',
  'app_cli_title',
  'app_cli_version',
  'app_cli_version_id',
  'customuser_id',
  'facility',
  'object_action',
  'object_id',
  'object_root_id',
  'object_type',
  'request_method',
  'request_type',
  'response_status_code',
  'selected_api',
  'timestamp',
];
const STATUSES = {
  CALLBACK: 'CALLBACK',
  SUCCESS: 'SUCCESS',
};

const packageJson = require('../package.json');
const PACKAGE_NAME = packageJson.name;
const PACKAGE_VERSION = packageJson.version;

module.exports = {
  DEFAULT_LOGGING_HTTP_API_KEY,
  DEFAULT_LOGGING_HTTP_ENDPOINT,
  HYDRATE_DIRECTIVE_HOIST,
  IS_TESTING,
  KILL_MAX_LIMIT,
  KILL_MIN_LIMIT,
  PACKAGE_NAME,
  PACKAGE_VERSION,
  RENDER_ONLY_METHODS,
  REQUEST_OBJECT_SHORTHAND_OPTIONS,
  RESPONSE_SIZE_LIMIT,
  SAFE_LOG_KEYS,
  SENSITIVE_KEYS,
  STATUSES,
};
