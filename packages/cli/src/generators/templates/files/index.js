const hydrators = require('./hydrators');
const newFile = require('./triggers/newFile');
const uploadFile = require('./creates/uploadFile');

module.exports = {
  // This is just shorthand to reference the installed dependencies you have.
  // Zapier will need to know these before we can upload.
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  // Any hydrators go here
  hydrators,

  // If you want your triggers to show up, you better include it here!
  triggers: {
    [newFile.key]: newFile,
  },

  // If you want your creates to show up, you better include it here!
  creates: {
    [uploadFile.key]: uploadFile,
  },
};
