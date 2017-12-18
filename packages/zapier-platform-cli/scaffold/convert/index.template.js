// Created by 'zapier convert'. This is just a stub - you will need to edit!

<%= REQUIRES %>

<%= HEADER %>

const App = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,
<% if (needsAuth) { %>
  authentication,
<% } %>
  beforeRequest: [
    <%= BEFORE_REQUESTS %>
  ],

  afterResponse: [
    <%= AFTER_RESPONSES %>
  ],

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
