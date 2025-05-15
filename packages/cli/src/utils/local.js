const path = require('node:path');

const { BASE_ENDPOINT } = require('../constants');
const { findCorePackageDir, runCommand } = require('./misc');
const { copyZapierWrapper, deleteZapierWrapper } = require('./zapierwrapper');

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
    const targetHost = (options.hostname || options.host)
      .replaceAll('lcurly-', '{{')
      .replaceAll('-rcurly', '}}');
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

    const isAlreadyRelay =
      parsedOriginalUrl.hostname === parsedRelayUrl.hostname &&
      parsedOriginalUrl.port === parsedRelayUrl.port;
    if (isAlreadyRelay) {
      // Just call the original fetch function; do *not* re-relay
      return fetchFunc(originalUrl, originalOptions);
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

const loadAppRawUsingImport = async (
  appDir,
  corePackageDir,
  shouldDeleteWrapper,
) => {
  const wrapperPath = await copyZapierWrapper(corePackageDir, appDir);
  let appRaw;
  try {
    // zapierwrapper.mjs is only available since zapier-platform-core v17.
    // And only zapierwrapper.mjs exposes appRaw just for this use case.
    // Convert path to file:// URL for Windows compatibility with ESM imports
    const pathForUrl = path.resolve(wrapperPath).replace(/\\/g, '/');
    const wrapperUrl = new URL(`file:///${pathForUrl.replace(/^\//, '')}`);
    appRaw = (await import(wrapperUrl.href)).appRaw;
  } catch (err) {
    if (err.name === 'SyntaxError') {
      // Run a separate process to print the line number of the SyntaxError.
      // This workaround is needed because `err` doesn't provide the location
      // info about the SyntaxError. However, if the error is thrown to
      // Node.js's built-in error handler, it will print the location info.
      // See: https://github.com/nodejs/node/issues/49441
      await runCommand(process.execPath, ['zapierwrapper.js'], {
        cwd: appDir,
      });
    }
    throw err;
  } finally {
    if (shouldDeleteWrapper) {
      await deleteZapierWrapper(appDir);
    }
  }

  return appRaw;
};

const loadAppRawUsingRequire = (appDir) => {
  let appRaw = require(appDir);
  if (appRaw && appRaw.default) {
    // Node.js 22+ supports using require() to import ESM.
    // For Node.js < 20.17.0, require() will throw an error on ESM.
    // https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require
    appRaw = appRaw.default;
  }
  return appRaw;
};

const getLocalAppHandler = async ({
  appDir = null,
  appId = null,
  deployKey = null,
  relayAuthenticationId = null,
  beforeRequest = null,
  afterResponse = null,
  shouldDeleteWrapper = true,
} = {}) => {
  appDir = path.resolve(appDir || process.cwd());

  const corePackageDir = findCorePackageDir();
  let appRaw;
  try {
    appRaw = loadAppRawUsingRequire(appDir);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND' || err.code === 'ERR_REQUIRE_ESM') {
      appRaw = await loadAppRawUsingImport(
        appDir,
        corePackageDir,
        shouldDeleteWrapper,
      );
    } else {
      // err.name === 'SyntaxError' or others
      throw err;
    }
  }

  if (beforeRequest) {
    appRaw.beforeRequest = [...(appRaw.beforeRequest || []), ...beforeRequest];
  }
  if (afterResponse) {
    appRaw.afterResponse = [...afterResponse, ...(appRaw.afterResponse || [])];
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

  // Assumes the entry point of zapier-platform-core is index.js
  const coreEntryPoint = path.join(corePackageDir, 'index.js');
  // Convert path to file:// URL for Windows compatibility with ESM imports
  const pathForUrl = path.resolve(coreEntryPoint).replace(/\\/g, '/');
  const coreEntryUrl = new URL(`file:///${pathForUrl.replace(/^\//, '')}`);
  const zapier = (await import(coreEntryUrl.href)).default;

  const handler = zapier.createAppHandler(appRaw);
  if (handler.length === 3) {
    // < v17: function handler(event, ctx, callback)
    return (event, ctx, callback) => {
      event = {
        ...event,
        calledFromCli: true,
      };
      return handler(event, ctx, callback);
    };
  } else {
    // >= v17: async function handler(event, ctx = {})
    return async (event, ctx = {}) => {
      event = {
        ...event,
        calledFromCli: true,
      };
      return await handler(event, ctx);
    };
  }
};

// Runs a local app command (./index.js) like {command: 'validate'};
const localAppCommand = async (event, appDir, shouldDeleteWrapper = true) => {
  const handler = await getLocalAppHandler({
    appId: event.appId,
    deployKey: event.deployKey,
    relayAuthenticationId: event.relayAuthenticationId,
    beforeRequest: event.beforeRequest,
    afterResponse: event.afterResponse,
    appDir,
    shouldDeleteWrapper,
  });

  if (handler.length === 3) {
    // < 17: function handler(event, ctx, callback)
    return new Promise((resolve, reject) => {
      event = {
        ...event,
        calledFromCli: true,
      };
      handler(event, {}, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response.results);
        }
      });
    });
  } else {
    // >= 17: async function handler(event, ctx = {})
    const response = await handler(event);
    return response.results;
  }
};

module.exports = {
  localAppCommand,
};
