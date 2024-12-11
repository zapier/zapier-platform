const { isValidNodeVersion } = require('../../utils/misc');
const { LAMBDA_VERSION } = require('../../constants');

// can't be fat arrow because it inherits `this` from commands
module.exports = function () {
  if (!isValidNodeVersion()) {
    this.error(
      `Requires node version >= ${LAMBDA_VERSION}, found ${process.versions.node}. Please upgrade Node.js.`,
    );
  }
};
