const authentication = require('./authentication');
const { includeBearerToken } = require('./before-handlers');
const hydrators = require('./hydrators');

const folder = require('./resources/folder');
const file = require('./resources/file');
const createTextFile = require('./creates/text-file');

// We can roll up all our behaviors in an App.
const App = {
  // This is just shorthand to reference the installed dependencies you have. Zapier will
  // need to know these before we can upload
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  authentication,

  hydrators,

  // Ordered list of functions to pass the request object through before
  // sending it. Here we register one function that will set the auth header.
  beforeRequest: [includeBearerToken],

  afterResponse: [],

  /* Register the two resources for this app. Each resource defines the `list`,
   * `search`, and `create` properties, allowing Zapier to automatically generate
   * a trigger, search, and a create for each one.
   */
  resources: {
    [folder.key]: folder,
    [file.key]: file,
  },

  triggers: {},

  searches: {},

  /* In addition to the default create from the file resource, we also want to
   * allow users to create plain text files, so we register that create here.
   */
  creates: {
    [createTextFile.key]: createTextFile,
  },
};

module.exports = App;
