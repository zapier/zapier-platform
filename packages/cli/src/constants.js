const os = require('os');
const path = require('path');
const semver = require('semver');
const versionStore = require('./version-store');

const DEBUG = (process.env.ZAPIER_DEBUG || 'false') === 'true';

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
const BUILD_DIR = 'build';
const DEFINITION_PATH = `${BUILD_DIR}/definition.json`;
const BUILD_PATH = `${BUILD_DIR}/build.zip`;
const SOURCE_PATH = `${BUILD_DIR}/source.zip`;
const BLACKLISTED_PATHS = [
  // Will be excluded from build.zip and source.zip
  '.git',
  '.env',
  '.environment',
  'build'
];
const nodeVersion = semver.Comparator(
  versionStore[versionStore.length - 1].nodeVersion
).semver.version;
const LAMBDA_VERSION = `v${nodeVersion}`;
const AUTH_KEY = 'deployKey';
const ANALYTICS_KEY = 'analyticsMode';
const ANALYTICS_MODES = {
  enabled: 'enabled',
  anonymous: 'anonymous',
  disabled: 'disabled'
};
const PACKAGE_VERSION = require('../package.json').version;
const UPDATE_NOTIFICATION_INTERVAL = 1000 * 60 * 60 * 24 * 7; // one week

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
  AUTH_LOCATION_RAW,
  AUTH_LOCATION,
  BASE_ENDPOINT,
  BLACKLISTED_PATHS,
  BUILD_DIR,
  BUILD_PATH,
  CURRENT_APP_FILE,
  DEBUG,
  DEFINITION_PATH,
  ENDPOINT,
  IS_TESTING,
  LAMBDA_VERSION,
  PACKAGE_VERSION,
  PLATFORM_PACKAGE,
  SOURCE_PATH,
  STARTER_REPO,
  UPDATE_NOTIFICATION_INTERVAL
};
