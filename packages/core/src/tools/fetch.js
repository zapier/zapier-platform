'use strict';

const { Writable } = require('stream');

const fetch = require('node-fetch');

// XXX: PatchedRequest is to get past node-fetch's check that forbids GET requests
// from having a body here:
// https://github.com/node-fetch/node-fetch/blob/v2.6.0/src/request.js#L75-L78
class PatchedRequest extends fetch.Request {
  constructor(url, opts) {
    const origMethod = ((opts && opts.method) || 'GET').toUpperCase();

    const isGetWithBody =
      (origMethod === 'GET' || origMethod === 'HEAD') && opts && opts.body;
    let newOpts = opts;
    if (isGetWithBody) {
      // Temporary remove body to fool fetch.Request constructor
      newOpts = { ...opts, body: null };
    }

    super(url, newOpts);

    this._isGetWithBody = isGetWithBody;

    if (isGetWithBody) {
      // Restore the body. The body is stored internally using a Symbol key. We
      // can't just do this[Symbol('Body internals')] as the symbol is internal.
      // We need to use Object.getOwnPropertySymbols() to get all the keys and
      // find the one that holds the body.
      const keys = Object.getOwnPropertySymbols(this);
      for (const k of keys) {
        if (this[k].body !== undefined) {
          this[k].body = Buffer.from(String(opts.body));
          break;
        }
      }
    }
  }

  get body() {
    if (this._isGetWithBody && !this._bodyCalled) {
      // This assumes node-fetch's check that disallows a GET request to have a
      // body happens on the first time it calls this.body. Might not work if
      // node-fetch breaks the assumption.
      this._bodyCalled = true;
      return null;
    }
    return super.body;
  }
}

const newFetch = (url, opts) => {
  const request = new PatchedRequest(url, opts);

  // fetch actually accepts a Request object as an argument. It'll clone the
  // request internally, that's why the PatchedRequest.body hack works.
  const responsePromise = fetch(request);

  // node-fetch clones request.body and use the cloned body internally. We need
  // to make sure to consume the original body stream so its internal buffer is
  // not filled up, which causes it to pause.
  // See https://github.com/node-fetch/node-fetch/issues/151
  //
  // Exclude form-data object to be consistent with
  // https://github.com/node-fetch/node-fetch/blob/v2.6.6/src/body.js#L403-L412
  if (
    request.body &&
    typeof request.body.pipe === 'function' &&
    typeof request.body.getBoundary !== 'function'
  ) {
    const nullStream = new Writable();
    nullStream._write = function (chunk, encoding, done) {
      done();
    };
    request.body.pipe(nullStream);
  }

  return responsePromise;
};

newFetch.Promise = require('./promise');

module.exports = newFetch;
