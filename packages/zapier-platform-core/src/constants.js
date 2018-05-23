'use strict';

const _process_args = process.argv.join(' ');
const IS_TESTING =
  _process_args.indexOf('mocha') > 0 ||
  _process_args.indexOf('jest') > 0 ||
  (process.env.NODE_ENV || '').startsWith('test');

const KILL_MIN_LIMIT = 250;
const KILL_MAX_LIMIT = 450 * 1000 * 1000;

const RESPONSE_SIZE_LIMIT = 6291456;

const HYDRATE_DIRECTIVE_HOIST = '$HOIST$';

const RENDER_ONLY_METHODS = ['authentication.oauth2Config.authorizeUrl'];

const REQUEST_OBJECT_SHORTHAND_OPTIONS = { replace: true };

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
  'token'
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
  'timestamp'
];

module.exports = {
  IS_TESTING,
  KILL_MIN_LIMIT,
  KILL_MAX_LIMIT,
  RESPONSE_SIZE_LIMIT,
  HYDRATE_DIRECTIVE_HOIST,
  RENDER_ONLY_METHODS,
  REQUEST_OBJECT_SHORTHAND_OPTIONS,
  DEFAULT_LOGGING_HTTP_ENDPOINT,
  DEFAULT_LOGGING_HTTP_API_KEY,
  SENSITIVE_KEYS,
  SAFE_LOG_KEYS
};
