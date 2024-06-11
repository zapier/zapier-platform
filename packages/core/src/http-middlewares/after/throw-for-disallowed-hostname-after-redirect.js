'use strict';

const { Error } = require('../../errors');

const disallowedRedirectHosts = [
  // Loopback addresses (IPv4)
  'localhost',
  '127.0.0.1',

  // Loopback addresses (IPv6)
  '::1',
  '[::1]',
];

function isDisallowedAfterRedirect(url) {
  try {
    const { hostname } = new URL(url);
    return disallowedRedirectHosts.includes(hostname);
  } catch (e) {
    // If URL parsing fails, consider it allowed
    // (being permissive just in case it affects backwards compatibility)
    return false;
  }
}

const throwForDisallowedHostnameAfterRedirect = (resp) => {
  // Looking at the response URL instead of the request URL
  // because the response URL can change after a redirect
  if (resp.redirected && isDisallowedAfterRedirect(resp.url)) {
    throw new Error('Redirecting to disallowed hostname');
  }

  return resp;
};

module.exports = throwForDisallowedHostnameAfterRedirect;
