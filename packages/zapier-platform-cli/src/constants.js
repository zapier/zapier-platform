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
const nodeVersion = semver.Comparator(
  versionStore[versionStore.length - 1].nodeVersion
).semver.version;
const LAMBDA_VERSION = `v${nodeVersion}`;
const AUTH_KEY = 'deployKey';
const PACKAGE_VERSION = require('../package.json').version;

const ART = `\
                zzzzzzzz
      zzz       zzzzzzzz       zzz
    zzzzzzz     zzzzzzzz     zzzzzzz
   zzzzzzzzzz   zzzzzzzz   zzzzzzzzzz
      zzzzzzzzz zzzzzzzz zzzzzzzzz
        zzzzzzzzzzzzzzzzzzzzzzzz
          zzzzzzzzzzzzzzzzzzzz
zzzzzzzzzzzzzzz          zzzzzzzzzzzzzzz
zzzzzzzzzzzzzzz          zzzzzzzzzzzzzzz
zzzzzzzzzzzzzzz          zzzzzzzzzzzzzzz
zzzzzzzzzzzzzzz          zzzzzzzzzzzzzzz
          zzzzzzzzzzzzzzzzzzzz
        zzzzzzzzzzzzzzzzzzzzzzzz
      zzzzzzzzz zzzzzzzz zzzzzzzzz
   zzzzzzzzzz   zzzzzzzz   zzzzzzzzzz
    zzzzzzz     zzzzzzzz     zzzzzzz
      zzz       zzzzzzzz       zzz
                zzzzzzzz`;

module.exports = {
  API_PATH,
  ART,
  AUTH_KEY,
  AUTH_LOCATION,
  AUTH_LOCATION_RAW,
  BASE_ENDPOINT,
  BUILD_DIR,
  BUILD_PATH,
  CURRENT_APP_FILE,
  DEBUG,
  DEFINITION_PATH,
  ENDPOINT,
  LAMBDA_VERSION,
  PACKAGE_VERSION,
  PLATFORM_PACKAGE,
  STARTER_REPO
};
