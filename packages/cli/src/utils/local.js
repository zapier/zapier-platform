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
 * @param {Object} [relayHeaders={}] - Extra headers to add to each request sent to the relay.
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
 *     'http://my-relay.test',
 *     { 'X-Relayed-By': 'MyRelayProxy' }
 *   );
 *
 *   // Now, calling https.request('https://example.com/hello') will actually
 *   // send a request to "http://my-relay.test/https://example.com/hello"
 *   // with X-Relayed-By header attached.
 */
function wrapHttpRequestFuncWithRelay(
  originalHttpRequest,
  originalHttpsRequest,
  relayUrl,
  relayHeaders = {},
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
      callback = arguments[1];
    }

    if (!options.method) {
      options.method = 'GET';
    }
    if (!options.headers) {
      options.headers = {};
    }

    // 2. Construct the path for the relay call
    let host = options.host;
    if (options.port && options.port.toString() !== '443') {
      host += `:${options.port}`;
    }
    const combinedPath = `${parsedRelayUrl.pathname}/${host}${options.path}`;

    // 3. Build final options to send to the relay
    const relayedOptions = {
      protocol: parsedRelayUrl.protocol,
      hostname: parsedRelayUrl.hostname,
      port: parsedRelayUrl.port,
      path: combinedPath + (parsedRelayUrl.search || ''),
      method: options.method,
      headers: {
        ...options.headers,
        ...relayHeaders,
      },
    };

    // 4. Wrap the callback to manipulate the response (if desired)
    const wrappedCallback = callback
      ? function relayResponseInterceptor(relayRes) {
          // Example: remove any "Via" header that might reveal the relay
          delete relayRes.headers.via;
          // Pass through to the original callback
          callback(relayRes);
        }
      : undefined;

    // 5. Make the request to the relay using whichever request function is appropriate
    const relayReq = relayRequestFunc(relayedOptions, wrappedCallback);

    // Return the actual ClientRequest so the caller can .write(), .end(), etc.
    return relayReq;
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
