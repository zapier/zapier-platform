'use strict';

const crypto = require('crypto');

const _ = require('lodash');

const resolveMethodPath = require('./resolve-method-path');

const MAX_PAYLOAD_SIZE = 2048; // most urls cannot be larger than 2,083

const wrapHydrate = payload => {
  payload = JSON.stringify(payload);

  if (process.env._ZAPIER_ONE_TIME_SECRET) {
    payload = new Buffer(payload).toString('base64');

    const signature = Buffer.from(
      crypto
        .createHmac('sha1', process.env._ZAPIER_ONE_TIME_SECRET)
        .update(payload)
        .digest()
    ).toString('base64');

    payload += ':' + signature;
  }

  return 'hydrate|||' + payload + '|||hydrate';
};

const createDehydrator = input => {
  const app = _.get(input, '_zapier.app');

  return (func, inputData) => {
    inputData = inputData || {};
    if (inputData.inputData) {
      throw new Error(
        'Oops! You passed a full `bundle` - really you should pass what you want under `inputData`!'
      );
    }
    const payloadSize = JSON.stringify(inputData).length;
    if (payloadSize > MAX_PAYLOAD_SIZE) {
      throw new Error(
        `Oops! You passed too much data (${payloadSize} bytes) to your dehydration function - try slimming it down under ${MAX_PAYLOAD_SIZE} bytes (usually by just passing the needed IDs).`
      );
    }
    return wrapHydrate({
      type: 'method',
      method: resolveMethodPath(app, func),
      // inputData vs. bundle is a legacy oddity
      bundle: _.omit(inputData, 'environment') // don't leak the environment
    });
  };
};

module.exports = createDehydrator;
