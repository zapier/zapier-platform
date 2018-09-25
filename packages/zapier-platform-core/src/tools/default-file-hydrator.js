'use strict';

const defaultFileHydrator = (z, bundle) => {
  const request = bundle.inputData.request || {};
  request.url = bundle.inputData.url || request.url;
  request.raw = true;

  const filePromise = z.request(request);
  const meta = bundle.inputData.meta || {};
  return z.stashFile(
    filePromise,
    meta.knownLength,
    meta.filename,
    meta.contentType
  );
};

module.exports = defaultFileHydrator;
