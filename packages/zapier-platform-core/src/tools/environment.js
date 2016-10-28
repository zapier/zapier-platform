'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const ensurePath = require('./ensure-path');

// Copy bundle environment into process.env, and vice versa,
// for convenience and compatibility with native environment vars.
const applyEnvironment = (event) => {
  event = ensurePath(event, 'bundle.environment'); // deprecated
  _.extend(
    process.env,
    event.bundle.environment || {}, // deprecated
    event.environment || {}
  );
};

// Remove junk from process.env.
const cleanEnvironment = () => {
  // not really a security measure - just prevent useless security bounty emails
  if (process.env.AWS_LAMBDA_FUNCTION_VERSION || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECURITY_TOKEN;
    delete process.env.AWS_SESSION_TOKEN;
    delete process.env.AWS_SECRET_ACCESS_KEY;
  }
};

const readEnvironmentFile = () => {
  const data = {};
  try {
    const content = fs.readFileSync(path.join(process.cwd(), '.environment'));
    _.split(content, '\n').map(line => {
      const parts = _.split(line, '=');
      const key = parts.shift();
      const value = parts.join('=');
      data[key] = value;
    });
    return data;
  } catch(err) {
    return data;
  }
};

const injectEnvironmentFile = () => {
  _.extend(process.env, readEnvironmentFile());
};

module.exports = {
  applyEnvironment,
  cleanEnvironment,
  injectEnvironmentFile
};
