const crypto = require('crypto');

const _ = require('lodash');
const request = require('request');
const { createSyncFn } = require('synckit');

// So `zapier build` doesn't forget to include request-worker.js
require('./request-worker');

// Converts WB `bundle.request` format to something `request` can use
const convertBundleRequest = (bundleOrBundleRequest) => {
  bundleOrBundleRequest = _.extend({}, bundleOrBundleRequest);

  // LEGACY: allow for the whole bundle to mistakingly be sent over
  const bundleRequest = bundleOrBundleRequest.request
    ? bundleOrBundleRequest.request
    : bundleOrBundleRequest;

  if (
    bundleRequest.auth &&
    Array.isArray(bundleRequest.auth) &&
    bundleRequest.auth.length === 2
  ) {
    bundleRequest.auth = {
      user: bundleRequest.auth[0],
      password: bundleRequest.auth[1],
    };
  }

  if (!bundleRequest.qs && bundleRequest.params) {
    bundleRequest.qs = bundleRequest.params;
  }
  if (!bundleRequest.body && bundleRequest.data) {
    bundleRequest.body = bundleRequest.data;
  }

  delete bundleRequest.params;
  delete bundleRequest.data;

  return bundleRequest;
};

const parseBody = (body) => {
  if (body) {
    if (typeof body === 'string' || body.writeInt32BE) {
      return String(body);
    }

    return body;
  }

  return null;
};

// Converts `request`'s response into a simplified object
const convertResponse = (response) => {
  if (response) {
    return {
      status_code: response.statusCode,
      headers: _.extend({}, response.headers),
      content: parseBody(response.body),
    };
  }

  return {};
};

const syncRequest = createSyncFn(require.resolve('./request-worker'));

const zfactory = (zcli, app, logger) => {
  const AWS = () => {
    // Direct require breaks the build as the module isn't found by browserify
    const moduleName = 'aws-sdk';
    return require(moduleName);
  };

  const jsonParse = (str) => {
    try {
      return JSON.parse(str);
    } catch (err) {
      let preview = str;

      if (str && str.length > 100) {
        preview = str.substr(0, 100);
      }

      throw new Error(`Error parsing response. We got: "${preview}"`);
    }
  };

  const jsonStringify = (obj) => {
    try {
      return JSON.stringify(obj);
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const sendHttpLog = (req, res) => {
    // Log fields here intend to match the ones in createHttpPatch in core
    const method = (req.method || 'GET').toUpperCase();
    const url = req.url || req.uri;
    const responseBody =
      typeof res.content === 'string'
        ? res.content
        : 'Could not show response content';
    logger(`${res.status_code} ${method} ${url}`, {
      log_type: 'http',
      request_type: 'devplatform-outbound',
      request_url: url,
      request_method: method,
      request_headers: req.headers,
      request_data: req.data,
      request_via_client: false,
      response_status_code: res.status_code,
      response_headers: res.headers,
      response_content: responseBody,
    });
  };

  const requestMethod = (bundleRequest, callback) => {
    const options = convertBundleRequest(bundleRequest);

    if (_.isFunction(callback)) {
      return request(options, (err, response) =>
        callback(err, convertResponse(response)),
      );
    }

    const normalizedOptions = request.initParams(options);
    const response = syncRequest(normalizedOptions);

    const convertedResponse = convertResponse(response);

    // syncRequest() is done by a worker thread, which isn't httpPatch'ed, so we
    // need to explicit write the http log here
    if (logger) {
      sendHttpLog(normalizedOptions, convertedResponse);
    }

    return convertedResponse;
  };

  const hash = (
    algorithm,
    string,
    encoding = 'hex',
    inputEncoding = 'binary',
  ) => {
    const hasher = crypto.createHash(algorithm);
    hasher.update(string, inputEncoding);

    return hasher.digest(encoding);
  };

  const hmac = (algorithm, key, string, encoding = 'hex') => {
    const hasher = crypto.createHmac(algorithm, key);
    hasher.update(string);

    return hasher.digest(encoding);
  };

  const snipify = (string) => {
    const SALT = process.env.SECRET_SALT || 'doesntmatterreally';
    if (!_.isString(string)) {
      return null;
    }

    const length = string.length;
    string += SALT;
    const result = hash('sha256', string);

    return `:censored:${length}:${result.substr(0, 10)}:`;
  };

  const dehydrate = (method, bundle) => {
    return zcli.dehydrate(app.hydrators.legacyMethodHydrator, {
      method,
      bundle,
    });
  };

  const dehydrateFile = (url, requestOptions, meta) => {
    return zcli.dehydrateFile(app.hydrators.legacyFileHydrator, {
      url,
      request: requestOptions,
      meta,
    });
  };

  return {
    AWS,
    JSON: {
      parse: jsonParse,
      stringify: jsonStringify,
    },
    request: requestMethod,
    hash,
    hmac,
    snipify,
    dehydrate,
    dehydrateFile,
  };
};

module.exports = zfactory;
