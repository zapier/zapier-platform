const chat_completion = require('./chat_completion');

// If you add a new create, make sure it is exported here to display in the Zapier Editor
module.exports = {
  [chat_completion.key]: chat_completion,
};
