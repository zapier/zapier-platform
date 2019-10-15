const { readFile } = require('./files');
const { AUTH_LOCATION } = require('../constants');

const readUserConfig = async () => {
  try {
    const buf = await readFile(AUTH_LOCATION);
    return JSON.parse(buf.toString());
  } catch (e) {
    return {};
  }
};

const writeUserConfig = newSettings => {
  // make sure not to blow out deployKey
};

module.exports = {
  readUserConfig,
  writeUserConfig
};
