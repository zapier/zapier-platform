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

const prepareRequest = function (req) {
  const input = req.input || {};

  // We will want to use _.defaultsDeep if one of these nested values ever defaults to true.
  req = _.defaults(req, {
    merge: true,
    removeMissingValuesFrom: {
      params: false,
      body: false,
    },
    replace: true, // always replace curlies
    skipThrowForStatus: false,
    _addContext: () => {},
  });

  req = sugarBody(req);

  // apply app requestTemplate to request
  if (req.merge) {
    const requestTemplate = (input._zapier.app || {}).requestTemplate;
    req = requestMerge(requestTemplate, req);
  }

  // replace {{curlies}} in the request
  if (req.replace) {
    const bank = createBundleBank(
      input._zapier.app,
      input._zapier.event,
      req.serializeValueForCurlies
    );
    req = recurseReplaceBank(req, bank);
  }

  req = coerceBody(req);

  req._requestStart = new Date();

  req._addContext(`Starting ${req.method} request to ${req.url}`);

  return finalRequest(req);
};

module.exports = prepareRequest;
