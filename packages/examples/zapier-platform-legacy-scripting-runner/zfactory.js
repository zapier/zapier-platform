const crypto = require('crypto');

const _ = require('lodash');
const deasync = require('deasync');
const request = require('request');

// Converts WB `bundle.request` format to something `request` can use
const convertBundleRequest = bundleOrBundleRequest => {
  bundleOrBundleRequest = _.extend({}, bundleOrBundleRequest);

  // LEGACY: allow for the whole bundle to mistakingly be sent over
  const bundleRequest = bundleOrBundleRequest.request
    ? bundleOrBundleRequest.request
    : bundleOrBundleRequest;

  let auth = null;

  if (
    bundleRequest.auth &&
    _.isArray(bundleRequest.auth) &&
    bundleRequest.auth.length === 2
  ) {
    auth = {
      user: bundleRequest.auth[0],
      password: bundleRequest.auth[1]
    };
  }

  bundleRequest.qs = bundleRequest.params || {};
  bundleRequest.auth = auth;
  bundleRequest.body = bundleRequest.data || '';

  delete bundleRequest.params;
  delete bundleRequest.data;

  return bundleRequest;
};

const parseBody = body => {
  if (body) {
    if (typeof body === 'string' || body.writeInt32BE) {
      return String(body);
    }

    return body;
  }

  return null;
};

// Converts `request`'s response into a simplified object
const convertResponse = response => {
  if (response) {
    return {
      status_code: response.statusCode,
      headers: _.extend({}, response.headers),
      content: parseBody(response.body)
    };
  }

  return {};
};

const syncRequest = deasync(request);

const zfactory = (zcli, app) => {
  const AWS = () => {
    // Direct require breaks the build as the module isn't found by browserify
    const moduleName = 'aws-sdk';
    return require(moduleName);
  };

  const jsonParse = str => {
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

  const jsonStringify = obj => {
    try {
      return JSON.stringify(obj);
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const requestMethod = (bundleRequest, callback) => {
    const options = convertBundleRequest(bundleRequest);

    if (_.isFunction(callback)) {
      return request(options, (err, response) =>
        callback(err, convertResponse(response))
      );
    }

    const response = syncRequest(options);
    return convertResponse(response);
  };

  const hash = (
    algorithm,
    string,
    encoding = 'hex',
    inputEncoding = 'binary'
  ) => {
    const hasher = crypto.createHash(algorithm);
    hasher.update(string, inputEncoding);

    return hasher.digest(encoding);
  };

  const hmac = (algorithm, key, string, encoding = 'hex') => {
    const hasher = crypto.createHash(algorithm, key);
    hasher.update(string);

    return hasher.digest(encoding);
  };

  const snipify = string => {
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
      bundle
    });
  };

  const dehydrateFile = (url, requestOptions, meta) => {
    return zcli.dehydrateFile(app.hydrators.legacyFileHydrator, {
      url,
      request: requestOptions,
      meta
    });
  };

  return {
    AWS,
    JSON: {
      parse: jsonParse,
      stringify: jsonStringify
    },
    request: requestMethod,
    hash,
    hmac,
    snipify,
    dehydrate,
    dehydrateFile
  };
};

module.exports = zfactory;
