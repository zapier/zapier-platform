'use strict';

const fetch = require('node-fetch');

const { NotImplementedError } = require('../../errors');
const { md5 } = require('../../tools/hashing');
const { parseDictHeader } = require('../../tools/http');

const buildDigestHeader = (username, password, url, method, creds) => {
  if (creds.algorithm && creds.algorithm.toUpperCase() !== 'MD5') {
    throw new NotImplementedError(
      "algorithm 'MD5-SESS' and 'SHA' are not implemented yet",
    );
  }

  const path = new URL(url).pathname;

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
      "qop other than 'auth' is not implemented yet",
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
        creds,
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
