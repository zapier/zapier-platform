'use strict';

const authentication = {
  type: 'basic',
  test: {
    url: 'https://api.github.com/user'
  },
  connectionLabel: '{{bundle.authData.username}}'
};

module.exports = authentication;
