'use strict';

const _ = require('lodash');
const stream = require('stream');
const querystring = require('querystring');

const {
  createBundleBank,
  normalizeEmptyBodyFields,
  recurseReplaceBank,
} = require('../../tools/cleaner');
const requestMerge = require('../../tools/request-merge');
const {
  getContentType,
  FORM_TYPE,
  JSON_TYPE_UTF8,
} = require('../../tools/http');

const { REPLACE_CURLIES } = require('../../constants');

const isStream = (obj) => obj instanceof stream.Stream;
const isPromise = (obj) => obj && typeof obj.then === 'function';

const sugarBody = (req) => {
  // move into the body as raw, set headers for coerce, merge to work

  req.headers = req.headers || {};

  if (!req.body && req.form) {
    req.body = req.form;
    req.headers['content-type'] = FORM_TYPE;
    delete req.form;
  }

  if (!req.body && req.json) {
    req.body = req.json;
    req.headers['content-type'] = JSON_TYPE_UTF8;
    delete req.json;
  }

  return req;
};

// Be careful not to JSONify a stream or buffer, stuff like that
const coerceBody = (req) => {
  const contentType = getContentType(req.headers || {});

  // No need for body on get
  if (req.method === 'GET' && (!req.allowGetBody || _.isEmpty(req.body))) {
    delete req.body;
  }

  // auto coerce form if header says so
  if (contentType === FORM_TYPE && req.body && !_.isString(req.body)) {
    req.body = querystring.stringify(req.body).replace(/%20/g, '+');
  }

  if (isStream(req.body)) {
    // leave a stream/pipe alone!
  } else if (isPromise(req.body)) {
    // leave a promise alone!
  } else if (Buffer.isBuffer(req.body)) {
    // leave a buffer alone!
  } else if (req.body && !_.isString(req.body)) {
    normalizeEmptyBodyFields(req);

    // this is a general - popular fallback
    req.body = JSON.stringify(req.body);

    if (!contentType) {
      req.headers['content-type'] = JSON_TYPE_UTF8;
    }
  }

  return req;
};

// Wrap up the request in a promise - if needed.
const finalRequest = (req) => {
  if (isPromise(req.body)) {
    return req.body.then((reqBodyRes) => {
      if (
        reqBodyRes &&
        reqBodyRes.body &&
        typeof reqBodyRes.body.pipe === 'function'
      ) {
        req.body = reqBodyRes.body;
      } else if (
        reqBodyRes &&
        reqBodyRes.content &&
        typeof reqBodyRes.content === 'string'
      ) {
        req.body = reqBodyRes.content;
      } else {
        req.body = reqBodyRes;
        // we could inspect response headers from reqBodyRes
        // and apply content type to req - but maybe later
        req = coerceBody(req);
      }
      return req;
    });
  } else {
    return req;
  }
};

const throwForCurlies = (value, path) => {
  path = path || [];
  if (typeof value === 'string') {
    if (/{{\s*(bundle|process)\.[^}]*}}/.test(value)) {
      throw new Error(
        'z.request() no longer supports {{bundle.*}} or {{process.*}} as of v17 ' +
          "unless it's used in a shorthand request defined by the integration. " +
          'Zapier Customers: Remove "{{curly braces}}" from your request. ' +
          'Developers: Use JavaScript template literals instead. ' +
          `Value in violation: "${value}" in attribute "${path.join('.')}".`,
      );
    }
  } else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      throwForCurlies(item, [...path, String(i)]);
    }
  } else if (_.isPlainObject(value)) {
    for (const [k, v] of Object.entries(value)) {
      throwForCurlies(v, [...path, k]);
    }
  }
};

const prepareRequest = function (req) {
  const input = req.input || {};

  // We will want to use _.defaultsDeep if one of these nested values ever defaults to true.
  req = _.defaults(req, {
    merge: true,
    removeMissingValuesFrom: {
      params: false,
      body: false,
    },
    // read default from app flags, but always defer to the request object if the value was set
    skipThrowForStatus: _.get(
      input,
      ['_zapier', 'app', 'flags', 'skipThrowForStatus'],
      false,
    ),
  });

  req = sugarBody(req);

  if (req[REPLACE_CURLIES] || req.merge) {
    const bank = createBundleBank(
      input?._zapier?.event || {},
      req.serializeValueForCurlies,
    );

    const replaceable = {
      url: req.url,
      headers: req.headers,
      params: req.params,
      body: req.body,
    };
    if (req[REPLACE_CURLIES]) {
      // replace {{curlies}} in the request
      req = {
        ...req,
        ...recurseReplaceBank(replaceable, bank),
      };
    } else {
      // throw if there's {{curlies}} in the request
      throwForCurlies(replaceable);
    }

    if (req.merge) {
      // Always replace {{curlies}} in reqeustTemplate regardless of
      // req[REPLACE_CURLIES]
      const requestTemplate = input._zapier?.app?.requestTemplate || {};
      const replaceable = {
        url: requestTemplate.url,
        headers: requestTemplate.headers,
        params: requestTemplate.params,
        body: requestTemplate.body,
      };
      const renderedTemplate = recurseReplaceBank(replaceable, bank);

      // Apply app.requestTemplate to request
      req = requestMerge(renderedTemplate, req);
    }
  }

  req = coerceBody(req);

  req._requestStart = new Date();

  const whatHappened = req.input._zapier.whatHappened;
  if (whatHappened) {
    whatHappened.push(`Starting ${req.method} request to ${req.url}`);
  }

  return finalRequest(req);
};

module.exports = prepareRequest;
