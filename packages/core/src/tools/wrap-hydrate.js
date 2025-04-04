'use strict';

const crypto = require('crypto');

const { DehydrateError } = require('../errors');

// https://nodejs.org/docs/latest-v16.x/api/http.html#httpmaxheadersize
// Base64 encoding adds approx 4/3 to the original size
// To account for encoding, we use the inverse to calc the max original size (3/4)
// 16kb limit * 1024 * (3 / 4) = 12.228 kb max, minus some room for additional overhead
const MAX_PAYLOAD_SIZE = 12000;

const wrapHydrate = (payload) => {
  payload = JSON.stringify(payload);

  if (payload.length > MAX_PAYLOAD_SIZE) {
    throw new DehydrateError(
      `Oops! You passed too much data (${payload.length} bytes) to your dehydration function - try slimming it down under ${MAX_PAYLOAD_SIZE} bytes (usually by just passing the needed IDs).`,
    );
  }

  if (process.env._ZAPIER_ONE_TIME_SECRET) {
    payload = Buffer.from(payload).toString('base64');

    const signature = Buffer.from(
      crypto
        .createHmac('sha1', process.env._ZAPIER_ONE_TIME_SECRET)
        .update(payload)
        .digest(),
    ).toString('base64');

    payload += ':' + signature;
  }

  return 'hydrate|||' + payload + '|||hydrate';
};

module.exports = wrapHydrate;
