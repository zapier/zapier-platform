'use strict';

const { recurseExtract } = require('@zapier/secret-scrubber');
const {
  isUrlWithSecrets,
  isSensitiveKey,
} = require('@zapier/secret-scrubber/lib/convenience');

// Will be initialized lazily
const SAFE_AUTH_DATA_KEYS = new Set();

const initSafeAuthDataKeys = () => {
  // An authData key in (safePrefixes x safeSuffixes) is considered safe to log
  // uncensored
  const safePrefixes = [
    'account',
    'bot_user',
    'cloud',
    'cloud_site',
    'company',
    'domain',
    'email',
    'environment',
    'location',
    'org',
    'organization',
    'project',
    'region',
    'scope',
    'scopes',
    'site',
    'subdomain',
    'team',
    'token_type',
    'user',
    'workspace',
  ];
  const safeSuffixes = ['', '_id', '_name', 'id', 'name'];
  for (const prefix of safePrefixes) {
    for (const suffix of safeSuffixes) {
      SAFE_AUTH_DATA_KEYS.add(prefix + suffix);
    }
  }
};

const isSafeAuthDataKey = (key) => {
  if (SAFE_AUTH_DATA_KEYS.size === 0) {
    initSafeAuthDataKeys();
  }
  return SAFE_AUTH_DATA_KEYS.has(key.toLowerCase());
};

const isUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return false;
  }
  const commonProtocols = [
    'https://',
    'http://',
    'ftp://',
    'ftps://',
    'file://',
  ];
  for (const protocol of commonProtocols) {
    if (value.startsWith(protocol)) {
      try {
        // eslint-disable-next-line no-new
        new URL(value);
        return true;
      } catch (e) {
        return false;
      }
    }
  }
  return false;
};

const findSensitiveValuesFromAuthData = (authData) =>
  recurseExtract(authData, (key, value) => {
    // for the most part, we should censor all the values from authData
    // the exception is safe urls, which should be filtered out - we want those to be logged
    // but, we _should_ censor-no-matter-what sensitive keys, even if their value is a safe url
    // this covers the case where someone's password is a valid url ¯\_(ツ)_/¯
    if (isSensitiveKey(key)) {
      return true;
    }
    if (isSafeAuthDataKey(key)) {
      return false;
    }
    if (isUrl(value) && !isUrlWithSecrets(value)) {
      return false;
    }
    return true;
  });

module.exports = {
  findSensitiveValuesFromAuthData,
};
