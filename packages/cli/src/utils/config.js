const { resolve } = require('path');

const { CURRENT_APP_FILE } = require('../constants');
const { writeFile, readFile } = require('./files');

const { prettyJSONstringify } = require('./display');

// Reads the JSON file in the app directory.
const readLinkedAppConfig = (appDir = '.') => {
  const file = resolve(appDir, CURRENT_APP_FILE);
  return readFile(file).then(buf => {
    return JSON.parse(buf.toString());
  });
};

// TODO: asyncify
const writeLinkedAppConfig = (app, appDir) => {
  const file = appDir ? resolve(appDir, CURRENT_APP_FILE) : CURRENT_APP_FILE;

  // read contents of existing config before writing
  return (
    readFile(file)
      .then(configBuff => {
        return Promise.resolve(JSON.parse(configBuff.toString()));
      })
      // we want to eat errors about bad json and missing files
      // and ensure the below code is passes a js object
      .catch(() => Promise.resolve({}))
      .then(config => {
        return Object.assign({}, config, { id: app.id, key: app.key });
      })
      .then(updatedConfig =>
        writeFile(file, prettyJSONstringify(updatedConfig))
      )
  );
};

module.exports = {
  readLinkedAppConfig,
  writeLinkedAppConfig
};
