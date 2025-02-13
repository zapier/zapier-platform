const authentication = require('./authentication');
const middleware = require('./middleware');
const dynamic_dropdowns = require('./dynamic_dropdowns');
const creates = require('./creates');

module.exports = {
  // This is just shorthand to reference the installed dependencies you have.
  // Zapier will need to know these before we can upload.
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  authentication,

  beforeRequest: [...middleware.befores],

  afterResponse: [...middleware.afters],

  // If you want your trigger to show up, you better include it here!
  triggers: {
    ...dynamic_dropdowns,
  },

  // If you want your searches to show up, you better include it here!
  searches: {},

  // If you want your creates to show up, you better include it here!
  creates: {
    ...creates,
  },

  resources: {},
};
