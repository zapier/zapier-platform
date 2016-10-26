// Created by 'zapier convert'. This is just a stub - you will need to edit!

<%= REQUIRES %>

const App = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  authentication: <%= AUTHENTICATION %>,

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
