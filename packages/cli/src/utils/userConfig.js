const { readFile, writeFile } = require('./files');
const { AUTH_LOCATION } = require('../constants');
const { prettyJSONstringify } = require('./display');

const readUserConfig = async () => {
  try {
    const buf = await readFile(AUTH_LOCATION);
    return JSON.parse(buf.toString());
  } catch (e) {
    return {};
  }
};

const writeUserConfig = async (newSettings) => {
  const currentSettings = await readUserConfig();
  const finalSettings = {
    ...currentSettings,
    ...newSettings,
  };
  // TODO: this blows out symlinks, but it always has
  // use fs.readPath to get to the actual location
  return writeFile(AUTH_LOCATION, prettyJSONstringify(finalSettings));
};

module.exports = {
  readUserConfig,
  writeUserConfig,
};
