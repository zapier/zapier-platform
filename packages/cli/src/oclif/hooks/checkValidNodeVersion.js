const { isValidNodeVersion } = require('../../utils/misc');
const { NODE_VERSION_CLI_REQUIRES } = require('../../constants');

// can't be fat arrow because it inherits `this` from commands
module.exports = function () {
  if (!isValidNodeVersion()) {
    this.error(
      `Requires node version ${NODE_VERSION_CLI_REQUIRES}, found ${process.versions.node}. Please upgrade Node.js.`,
    );
  }
};
