const os = require('os');
const path = require('path');
const versionStore = require('./version-store');

const BASE_ENDPOINT = process.env.ZAPIER_BASE_ENDPOINT || 'https://zapier.com';
const API_PATH = '/api/platform/cli';
const ENDPOINT = process.env.ZAPIER_ENDPOINT || BASE_ENDPOINT + API_PATH;
const STARTER_REPO =
  process.env.ZAPIER_STARTER_REPO || 'zapier/zapier-platform-example-app';
const AUTH_LOCATION_RAW = '~/.zapierrc';
const AUTH_LOCATION =
  process.env.ZAPIER_AUTH_LOCATION || path.resolve(os.homedir(), '.zapierrc');
const CURRENT_APP_FILE = process.env.ZAPIER_CURRENT_APP_FILE || '.zapierapprc';
const PLATFORM_PACKAGE = 'zapier-platform-core';
const LEGACY_RUNNER_PACKAGE = 'zapier-platform-legacy-scripting-runner';
const BUILD_DIR = 'build';
const DEFINITION_PATH = `${BUILD_DIR}/definition.json`;
const BUILD_PATH = `${BUILD_DIR}/build.zip`;
const SOURCE_PATH = `${BUILD_DIR}/source.zip`;
const BLACKLISTED_PATHS = [
  // Will be excluded from build.zip and source.zip
  '.git',
  '.env',
  '.environment',
  'build',
];
const NODE_VERSION = versionStore[versionStore.length - 1].nodeVersion;
const LAMBDA_VERSION = `v${NODE_VERSION}`;
const NODE_VERSION_CLI_REQUIRES = '>=14'; // should be the oldest non-ETL version
const AUTH_KEY = 'deployKey';
const ANALYTICS_KEY = 'analyticsMode';
const ANALYTICS_MODES = {
  enabled: 'enabled',
  anonymous: 'anonymous',
  disabled: 'disabled',
};

const packageJson = require('../package.json');
const PACKAGE_NAME = packageJson.name;
const PACKAGE_VERSION = packageJson.version;

const UPDATE_NOTIFICATION_INTERVAL = 1000 * 60 * 60 * 24 * 7; // one week

const CHECK_REF_DOC_LINK =
  'https://platform.zapier.com/docs/integration-checks-reference';

const ISSUES_URL =
  'https://github.com/zapier/zapier-platform/issues/new/choose';

// can't just read from argv because they could have lots of extra data, such as
// [ '/Users/david/.nvm/versions/node/v10.13.0/bin/node',
//   '/Users/david/projects/zapier/platform/node_modules/.bin/mocha',
//   'src/tests' ]
const argvStr = process.argv.join(' ');
const IS_TESTING =
  argvStr.includes('mocha') ||
  argvStr.includes('jest') ||
  (process.env.NODE_ENV || '').toLowerCase().startsWith('test');

module.exports = {
  ANALYTICS_KEY,
  ANALYTICS_MODES,
  API_PATH,
  AUTH_KEY,
  AUTH_LOCATION,
  AUTH_LOCATION_RAW,
  BASE_ENDPOINT,
  BLACKLISTED_PATHS,
  BUILD_DIR,
  BUILD_PATH,
  CHECK_REF_DOC_LINK,
  CURRENT_APP_FILE,
  DEFINITION_PATH,
  ENDPOINT,
  IS_TESTING,
  ISSUES_URL,
  LAMBDA_VERSION,
  LEGACY_RUNNER_PACKAGE,
  NODE_VERSION,
  NODE_VERSION_CLI_REQUIRES,
  PACKAGE_NAME,
  PACKAGE_VERSION,
  PLATFORM_PACKAGE,
  SOURCE_PATH,
  STARTER_REPO,
  UPDATE_NOTIFICATION_INTERVAL,
};
