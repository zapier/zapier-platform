const LAMBDA_VERSION = require('../constants').LAMBDA_VERSION;

const isCorrectVersion = (context) => {
  if (process.version !== LAMBDA_VERSION) {
    context.line(`You're performing commands on Node ${process.version}, but Zapier runs your code on ${LAMBDA_VERSION}. The version numbers must match. See https://zapier.github.io/zapier-platform-cli/index.html#requirements for more info.`);
    return false;
  } else {
    return true;
  }
};

module.exports = {
  isCorrectVersion
};
