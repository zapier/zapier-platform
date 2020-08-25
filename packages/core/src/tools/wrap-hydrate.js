'use strict';

const crypto = require('crypto');

const { DehydrateError } = require('../errors');

// Max URL length for Node is 8KB (https://stackoverflow.com/a/56954244/)
// 8 * 1024 * (3 / 4) = 6144 max, minus some room for additional overhead
const MAX_PAYLOAD_SIZE = 6000;

const wrapHydrate = (payload) => {
  payload = JSON.stringify(payload);

  if (payload.length > MAX_PAYLOAD_SIZE) {
    throw new DehydrateError(
      `Oops! You passed too much data (${payload.length} bytes) to your dehydration function - try slimming it down under ${MAX_PAYLOAD_SIZE} bytes (usually by just passing the needed IDs).`
    );
  }

  if (process.env._ZAPIER_ONE_TIME_SECRET) {
    payload = Buffer.from(payload).toString('base64');

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

module.exports = wrapHydrate;
