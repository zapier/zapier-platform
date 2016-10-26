const os = require('os');
const path = require('path');

const DEBUG = (process.env.ZAPIER_DEBUG || 'false') === 'true';

const BASE_ENDPOINT = process.env.ZAPIER_BASE_ENDPOINT || 'https://zapier.com';
const API_PATH = '/api/platform/cli';
const ENDPOINT = process.env.ZAPIER_ENDPOINT || BASE_ENDPOINT + API_PATH;
const STARTER_REPO = process.env.ZAPIER_STARTER_REPO || 'zapier/zapier-platform-example-app';
const AUTH_LOCATION_RAW = '~/.zapierrc';
const AUTH_LOCATION = process.env.ZAPIER_AUTH_LOCATION || path.resolve(os.homedir(), '.zapierrc');
const CURRENT_APP_FILE = process.env.ZAPIER_CURRENT_APP_FILE || '.zapierapprc';
const PLATFORM_PACKAGE = 'zapier-platform-core';
const DEFINITION_PATH = 'build/definition.json';
const BUILD_PATH = 'build/build.zip';

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
  DEBUG,
  BASE_ENDPOINT,
  API_PATH,
  ENDPOINT,
  STARTER_REPO,
  AUTH_LOCATION_RAW,
  AUTH_LOCATION,
  CURRENT_APP_FILE,
  PLATFORM_PACKAGE,
  DEFINITION_PATH,
  BUILD_PATH,
  ART
};
