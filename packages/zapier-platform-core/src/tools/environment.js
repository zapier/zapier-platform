'use strict';

const _ = require('lodash');
const path = require('path');
const dotenv = require('dotenv');

const ensurePath = require('./ensure-path');

const { IS_TESTING } = require('../constants');

// Copy bundle environment into process.env, and vice versa,
// for convenience and compatibility with native environment vars.
const applyEnvironment = event => {
  event = ensurePath(event, 'bundle');
  _.extend(process.env, event.environment || {});
};

// Remove junk from process.env.
const cleanEnvironment = () => {
  // not really a security measure - just prevent useless security bounty emails
  if (
    process.env.AWS_LAMBDA_FUNCTION_VERSION ||
    process.env.AWS_LAMBDA_FUNCTION_NAME
  ) {
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECURITY_TOKEN;
    delete process.env.AWS_SESSION_TOKEN;
    delete process.env.AWS_SECRET_ACCESS_KEY;
  }
};

const localFilepath = filename => {
  return path.join(process.cwd(), filename || '');
};

const injectEnvironmentFile = filename => {
  if (filename) {
    filename = localFilepath(filename);
  }
  // reads ".env" if filename is falsy, needs full path otherwise
  let result = dotenv.load({ path: filename });
  if (result.error) {
    // backwards compatibility
    result = dotenv.load({ path: localFilepath('.environment') });
    if (result.parsed && !IS_TESTING) {
      console.log(
        [
          '\nWARNING: `.environment` files will no longer be read by default in the next major version.',
          'Either rename your file to `.env` or explicitly call this function with a filename:',
          '\n    zapier.tools.env.inject(".environment");\n\n'
        ].join('\n')
      );
    }
  }
};

module.exports = {
  applyEnvironment,
  cleanEnvironment,
  injectEnvironmentFile
};
