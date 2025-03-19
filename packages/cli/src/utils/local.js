const _ = require('lodash');
const path = require('path');

const { findCorePackageDir } = require('./misc');
const { BASE_ENDPOINT } = require('../constants');

/**
 * Wraps Node's http.request() / https.request() so that all requests go via a relay URL.
 * It decides whether to use the http or https module based on the relay URL's protocol.
 *
 * @param {Function} originalHttpRequest - The original http.request function.
 * @param {Function} originalHttpsRequest - The original https.request function.
 * @param {string} relayUrl - The base URL to which we relay. (e.g., 'http://my-relay.test')
 * @param {Object} relayHeaders - Extra headers to add to each request sent to the relay.
 * @returns {Function} A function with the same signature as http(s).request that relays instead.
 *
 * Usage:
 *   const http = require('http');
 *   const https = require('https');
 *
 *   // Replace https.request with our wrapped version:
 *   https.request = wrapHttpRequestFuncWithRelay(
 *     http.request,
 *     https.request,
 *     'https://my-relay.test',
 *     { 'X-Relayed-By': 'MyRelayProxy' }
 *   );
 *
 *   // Now, calling https.request('https://example.com/hello') will actually
 *   // send a request to "https://my-relay.test/example.com/hello"
 *   // with X-Relayed-By header attached.
 */
function wrapHttpRequestFuncWithRelay(
  originalHttpRequest,
  originalHttpsRequest,
  relayUrl,
  relayHeaders,
) {
  const parsedRelayUrl = new URL(relayUrl);

  // Decide if the relay itself is HTTP or HTTPS
  const isRelayHttps = parsedRelayUrl.protocol === 'https:';

  // Pick which request function to use to talk to the relay
  const relayRequestFunc = isRelayHttps
    ? originalHttpsRequest
    : originalHttpRequest;

  /**
   * The actual wrapped request function.
   * Accepts the same arguments as http(s).request:
   *    (options[, callback]) or (url[, options][, callback])
   */
  return function wrappedRequest(originalOptions, originalCallback) {
    let options;
    let callback;

    // 1. Normalize arguments (string URL vs. options object)
    if (typeof originalOptions === 'string') {
      // Called like request(urlString, [...])
      try {
        const parsedOriginalUrl = new URL(originalOptions);

        if (typeof originalCallback === 'object') {
          // request(urlString, optionsObject, callback)
          options = { ...originalCallback };
          callback = arguments[2];
        } else {
          // request(urlString, callback) or request(urlString)
          options = {};
          callback = originalCallback;
        }

        // Merge in the URL parts if not explicitly set in options
        options.protocol = options.protocol || parsedOriginalUrl.protocol;
        options.hostname = options.hostname || parsedOriginalUrl.hostname;
        options.port = options.port || parsedOriginalUrl.port;
        options.path =
          options.path || parsedOriginalUrl.pathname + parsedOriginalUrl.search;
      } catch (err) {
        // If it's not a valid absolute URL, treat it as a path
        // or re-throw if you prefer strictness.
        options = {};
        callback = originalCallback;
        options.path = originalOptions;
      }
    } else {
      // Called like request(optionsObject, [callback])
      options = { ...originalOptions };
      callback = originalCallback;
    }

    // 2. Default method and headers
    if (!options.method) {
      options.method = 'GET';
    }
    if (!options.headers) {
      options.headers = {};
    }

    // 3. Decide whether to relay or not
    // If the request is being sent to the same host:port as our relay,
    // we do NOT want to relay again. We just call the original request.
    const targetHost = options.hostname || options.host;
    const targetPort = options.port ? String(options.port) : '';
    const relayHost = parsedRelayUrl.hostname;
    const relayPort = parsedRelayUrl.port ? String(parsedRelayUrl.port) : '';

    const isAlreadyRelay =
      targetHost === relayHost &&
      // If no port was specified, assume default port comparison as needed
      (targetPort === relayPort || (!targetPort && !relayPort));

    if (isAlreadyRelay) {
      // Just call the original function; do *not* re-relay
      const originalFn =
        options.protocol === 'https:'
          ? originalHttpsRequest
          : originalHttpRequest;
      return originalFn(options, callback);
    }

    // 4. Otherwise, build the path we want to relay to
    let finalHost = targetHost;
    if (targetPort && targetPort !== '443') {
      finalHost += `:${targetPort}`;
    }
    const combinedPath = `${parsedRelayUrl.pathname}/${finalHost}${options.path}`;

    // 5. Build final options for the relay request
    const relayedOptions = {
      protocol: parsedRelayUrl.protocol,
      hostname: relayHost,
      port: relayPort,
      path: combinedPath,
      method: options.method,
      headers: {
        ...options.headers,
        ...relayHeaders,
      },
    };

    // 6. Make the relay request
    const relayReq = relayRequestFunc(relayedOptions, callback);
    return relayReq;
  };
}

/**
 * Wraps a fetch function so that all requests get relayed to a specified relay URL.
 * The final relay URL includes: relayUrl + "/" + originalHost + originalPath
 *
 * @param {Function} fetchFunc - The original fetch function (e.g., global.fetch).
 * @param {string} relayUrl - The base URL to which we relay. (e.g. 'https://my-relay.test')
 * @param {Object} relayHeaders - Extra headers to add to each request sent to the relay.
 * @returns {Function} A function with the same signature as `fetch(url, options)`.
 *
 * Usage:
 *   const wrappedFetch = wrapFetchWithRelay(
 *     fetch,
 *     'https://my-relay.test',
 *     { 'X-Relayed-By': 'MyRelayProxy' },
 *   );
 *
 *   // Now when you do:
 *   //   wrappedFetch('https://example.com/api/user?id=123', { method: 'POST' });
 *   // it actually sends a request to:
 *   //   https://my-relay.test/example.com/api/user?id=123
 *   // with "X-Relayed-By" header included.
 */
function wrapFetchWithRelay(fetchFunc, relayUrl, relayHeaders) {
  const parsedRelayUrl = new URL(relayUrl);

  return async function wrappedFetch(originalUrl, originalOptions = {}) {
    // Attempt to parse the originalUrl as an absolute URL
    const parsedOriginalUrl = new URL(originalUrl);

    // Build the portion that includes the original host (and port if present)
    let host = parsedOriginalUrl.hostname;
    // If there's a port that isn't 443 (for HTTPS) or 80 (for HTTP), append it
    // (Adjust to your preferences; here we loosely check for 443 only.)
    if (parsedOriginalUrl.port && parsedOriginalUrl.port.toString() !== '443') {
      host += `:${parsedOriginalUrl.port}`;
    }

    // Combine the relay's pathname with the "host + path" from the original
    // For example: relayUrl = http://my-relay.test
    //   => parsedRelayUrl.pathname might be '/'
    //   => combinedPath = '/example.com:8080/some/path'
    const combinedPath = `${parsedRelayUrl.pathname}/${host}${parsedOriginalUrl.pathname}`;

    // Merge in the search strings: the relay's own search (if any) plus the original URL's search
    const finalUrl = `${parsedRelayUrl.origin}${combinedPath}${parsedRelayUrl.search}${parsedOriginalUrl.search}`;

    // Merge the user's headers with the relayHeaders
    const mergedHeaders = {
      ...(originalOptions.headers || {}),
      ...relayHeaders,
    };

    const finalOptions = {
      ...originalOptions,
      headers: mergedHeaders,
    };

    // Call the real fetch with our new URL and merged options
    return fetchFunc(finalUrl, finalOptions);
  };
}

const getLocalAppHandler = ({
  reload = false,
  baseEvent = {},
  appId = null,
  deployKey = null,
  relayAuthenticationId = null,
} = {}) => {
  const entryPath = `${process.cwd()}/index`;
  const rootPath = path.dirname(require.resolve(entryPath));
  const corePackageDir = findCorePackageDir();

  if (reload) {
    Object.keys(require.cache).forEach((cachePath) => {
      if (cachePath.startsWith(rootPath)) {
        delete require.cache[cachePath];
      }
    });
  }
  let appRaw, zapier;
  try {
    appRaw = require(entryPath);
    zapier = require(corePackageDir);
  } catch (err) {
    // this err.stack doesn't give a nice traceback at all :-(
    // maybe we could do require('syntax-error') in the future
    return (event, ctx, callback) => callback(err);
  }

  if (appId && deployKey && relayAuthenticationId) {
    const relayUrl = `${BASE_ENDPOINT}/api/platform/cli/apps/${appId}/relay`;
    const relayHeaders = {
      'x-relay-authentication-id': relayAuthenticationId,
      'x-deploy-key': deployKey,
    };

    const http = require('http');
    const https = require('https');
    const origHttpRequest = http.request;
    const origHttpsRequest = https.request;
    http.request = wrapHttpRequestFuncWithRelay(
      origHttpRequest,
      origHttpsRequest,
      relayUrl,
      relayHeaders,
    );
    https.request = wrapHttpRequestFuncWithRelay(
      origHttpRequest,
      origHttpsRequest,
      relayUrl,
      relayHeaders,
    );

    global.fetch = wrapFetchWithRelay(global.fetch, relayUrl, relayHeaders);
  }

  const handler = zapier.createAppHandler(appRaw);
  return (event, ctx, callback) => {
    event = _.merge(
      {},
      event,
      {
        calledFromCli: true,
      },
      baseEvent,
    );
    handler(event, _, callback);
  };
};

// Runs a local app command (./index.js) like {command: 'validate'};
const localAppCommand = (event) => {
  const handler = getLocalAppHandler({
    appId: event.appId,
    deployKey: event.deployKey,
    relayAuthenticationId: event.relayAuthenticationId,
  });
  return new Promise((resolve, reject) => {
    handler(event, {}, (err, resp) => {
      if (err) {
        reject(err);
      } else {
        resolve(resp.results);
      }
    });
  });
};

module.exports = {
  getLocalAppHandler,
  localAppCommand,
};
