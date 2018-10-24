'use strict';

const crypto = require('crypto');
const urllib = require('url');

const fetch = require('node-fetch');

const { NotImplementedError } = require('../../errors');

// This function splits a comma-separated string described by RFC 2068 Section 2.
// Ported from https://github.com/python/cpython/blob/f081fd83/Lib/urllib/request.py#L1399-L1440
const parseHttpList = s => {
  const res = [];
  let part = '';

  let escape = false,
    quote = false;

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

  return res.map(x => x.trim());
};

// Parse lists of key, value pairs as described by RFC 2068 Section 2 and convert them
// into a python dict.
// Ported from https://github.com/requests/requests/blob/d2962f1d/requests/utils.py#L342-L373
const parseDictHeader = s => {
  const res = {};

  const items = parseHttpList(s);

  items.forEach(item => {
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

const md5 = s =>
  crypto
    .createHash('md5')
    .update(s)
    .digest('hex');

const buildDigestHeader = (username, password, url, method, creds) => {
  if (creds.algorithm && creds.algorithm.toUpperCase() !== 'MD5') {
    throw new NotImplementedError(
      "algorithm 'MD5-SESS' and 'SHA' are not implemented yet"
    );
  }

  const path = urllib.parse(url).path;

  const HA1 = md5(`${username}:${creds.realm}:${password}`);
  const HA2 = md5(`${method}:${path}`);

  let response, cnonce;
  if (!creds.qop) {
    response = md5(`${HA1}:${creds.nonce}:${HA2}`);
  } else if (
    creds.qop === 'auth' ||
    creds.qop.split(',').indexOf('auth') >= 0
  ) {
    cnonce = md5(Date.now().toString()).substr(0, 16);
    response = md5(`${HA1}:${creds.nonce}:00000001:${cnonce}:auth:${HA2}`);
  } else {
    throw new NotImplementedError(
      "qop other than 'auth' is not implemented yet"
    );
  }

  let base =
    `username="${username}", realm="${creds.realm}", nonce="${creds.nonce}", ` +
    `uri="${path}", response="${response}"`;

  if (creds.opaque) {
    base += `, opaque="${creds.opaque}"`;
  }
  if (creds.algorithm) {
    base += `, algorithm="${creds.algorithm}"`;
  }
  if (creds.qop) {
    base += `, qop="${creds.qop}"`;
  }
  if (cnonce) {
    base += `, nc=00000001, cnonce="${cnonce}"`;
  }

  return `Digest ${base}`;
};

const addDigestAuthHeader = async (request, z, bundle) => {
  // Send a request without any auth header. Expect 401 and get nonce and other
  // necessary info from WWW-Authenticate header to do digest auth.
  // TODO: May reuse nonce to save a request
  const method = request.method || 'GET';
  const res = await fetch(request.url, { method });

  if (res.status === 401) {
    let credstr = res.headers.get('www-authenticate');
    if (credstr && credstr.startsWith('Digest ')) {
      credstr = credstr.substr(7);
      const creds = parseDictHeader(credstr);
      request.headers = request.headers || {};
      request.headers.Authorization = buildDigestHeader(
        bundle.authData.username,
        bundle.authData.password,
        request.url,
        method,
        creds
      );

      const cookie = res.headers.get('set-cookie');
      if (cookie) {
        request.headers.Cookie = res.headers.get('set-cookie');
      }
    }
  }

  return request;
};

module.exports = addDigestAuthHeader;
