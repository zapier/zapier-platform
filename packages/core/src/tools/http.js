const _ = require('lodash');
const fetch = require('node-fetch');

const FORM_TYPE = 'application/x-www-form-urlencoded';
const JSON_TYPE = 'application/json';
const JSON_TYPE_UTF8 = 'application/json; charset=utf-8';

const getContentType = (headers) => {
  const headerKeys = Object.keys(headers);
  let foundKey = '';

  _.each(headerKeys, (key) => {
    if (key.toLowerCase() === 'content-type') {
      foundKey = key;
      return false;
    }

    return true;
  });

  return _.get(headers, foundKey, '');
};

// This function splits a comma-separated string described by RFC 2068 Section 2.
// Ported from https://github.com/python/cpython/blob/f081fd83/Lib/urllib/request.py#L1399-L1440
const parseHttpList = (s) => {
  const res = [];
  let part = '';

  let escape = false;
  let quote = false;

  for (let i = 0; i < s.length; i++) {
    const cur = s.charAt(i);
    if (escape) {
      part += cur;
      escape = false;
      continue;
    }
    if (quote) {
      if (cur === '\\') {
        escape = true;
        continue;
      } else if (cur === '"') {
        quote = false;
      }
      part += cur;
      continue;
    }

    if (cur === ',') {
      res.push(part);
      part = '';
      continue;
    }

    if (cur === '"') {
      quote = true;
    }

    part += cur;
  }

  if (part) {
    res.push(part);
  }

  return res.map((x) => x.trim());
};

// Parse lists of key, value pairs as described by RFC 2068 Section 2 and convert them
// into an associative array.
// Ported from https://github.com/requests/requests/blob/d2962f1d/requests/utils.py#L342-L373
const parseDictHeader = (s) => {
  const res = {};

  const items = parseHttpList(s);

  items.forEach((item) => {
    if (item.includes('=')) {
      const parts = item.split('=');
      const name = parts[0];
      let value = parts.slice(1).join('=');

      if (value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.substring(1, value.length - 1);
      }
      res[name] = value;
    } else {
      res[item] = null;
    }
  });

  return res;
};

const unheader = (h) =>
  h instanceof fetch.Headers && _.isFunction(h.toJSON) ? h.toJSON() : h;

module.exports = {
  FORM_TYPE,
  JSON_TYPE,
  JSON_TYPE_UTF8,
  getContentType,
  parseDictHeader,
  unheader,
};
