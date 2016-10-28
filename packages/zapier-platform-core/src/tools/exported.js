const injectEnvironmentFile = require('./environment').injectEnvironmentFile;

// Intended to be available on zapier.tools - IE: zapier.tools.env.inject();
module.exports = {
  env: {
    inject: injectEnvironmentFile
  }
};
