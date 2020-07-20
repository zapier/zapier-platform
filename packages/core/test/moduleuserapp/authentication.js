'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

exports.type = 'oauth2';

exports.test = () => 'test';

const oauth2Config = (exports.oauth2Config = {});

oauth2Config.autoRefresh = true;

oauth2Config.authorizeUrl = {
  url: 'https://example.com/auth/oauth/v2/authorize',
};
