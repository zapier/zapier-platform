<%= REQUIRES %>

const App = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  resources: {
  },

  triggers: {
    <%= TRIGGERS %>
  },

  searches: {
    <%= SEARCHES %>
  },

  creates: {
    <%= CREATES %>
  }

};

module.exports = App;
