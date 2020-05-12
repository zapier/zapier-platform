'use strict';

const _ = require('lodash');
const path = require('path');
const FormData = require('form-data');
const contentDisposition = require('content-disposition');

const request = require('./request-client-internal');
const ZapierPromise = require('./promise');

const isPromise = (obj) => obj && typeof obj.then === 'function';

const UPLOAD_MAX_SIZE = 1000 * 1000 * 150; // 150mb, in zapier backend too

const LENGTH_ERR_MESSAGE =
  'We could not calculate the length of your file - please ' +
  'pass a knownLength like z.stashFile(f, knownLength)';

const DEFAULT_FILE_NAME = 'unnamedfile';
const DEFAULT_CONTENT_TYPE = 'application/octet-stream';

const uploader = (
  signedPostData,
  bufferStringStream,
  knownLength,
  filename,
  contentType
) => {
  const form = new FormData();

  if (knownLength && knownLength > UPLOAD_MAX_SIZE) {
    return ZapierPromise.reject(
      new Error(`${knownLength} is too big, ${UPLOAD_MAX_SIZE} is the max`)
    );
  }

  _.each(signedPostData.fields, (value, key) => {
    form.append(key, value);
  });

  filename = path.basename(filename || DEFAULT_FILE_NAME).replace('"', '');

  form.append('Content-Disposition', contentDisposition(filename));

  form.append('file', bufferStringStream, {
    contentType,
    knownLength,
    filename,
  });

  // Try to catch the missing length early, before upload to S3 fails.
  try {
    form.getLengthSync();
  } catch (err) {
    throw new Error(LENGTH_ERR_MESSAGE);
  }

  // Send to S3 with presigned request.
  return request({
    url: signedPostData.url,
    method: 'POST',
    body: form,
  }).then((res) => {
    if (res.status === 204) {
      return `${signedPostData.url}${signedPostData.fields.key}`;
    }
    if (
      res.content.indexOf(
        'You must provide the Content-Length HTTP header.'
      ) !== -1
    ) {
      throw new Error(LENGTH_ERR_MESSAGE);
    }
    throw new Error(`Got ${res.status} - ${res.content}`);
  });
};

// Designed to be some user provided function/api.
const createFileStasher = (input) => {
  const rpc = _.get(input, '_zapier.rpc');

  return (bufferStringStream, knownLength, filename, contentType) => {
    // TODO: maybe this could be smart?
    // if it is already a public url, do we pass through? or upload?
    if (!rpc) {
      return ZapierPromise.reject(new Error('rpc is not available'));
    }

    const isRunningOnHydrator =
      _.get(input, '_zapier.event.method', '').indexOf('hydrators.') === 0;
    const isRunningOnCreate =
      _.get(input, '_zapier.event.method', '').indexOf('creates.') === 0;

    if (!isRunningOnHydrator && !isRunningOnCreate) {
      return ZapierPromise.reject(
        new Error(
          'Files can only be stashed within a create or hydration function/method.'
        )
      );
    }

    const fileContentType = contentType || DEFAULT_CONTENT_TYPE;

    return rpc('get_presigned_upload_post_data', fileContentType).then(
      (result) => {
        if (isPromise(bufferStringStream)) {
          return bufferStringStream.then((maybeResponse) => {
            const isStreamed = _.get(maybeResponse, 'request.raw', false);

            const parseFinalResponse = (response) => {
              let newBufferStringStream = response;
              if (_.isString(response)) {
                newBufferStringStream = response;
              } else if (response) {
                if (Buffer.isBuffer(response)) {
                  newBufferStringStream = response;
                } else if (Buffer.isBuffer(response.dataBuffer)) {
                  newBufferStringStream = response.dataBuffer;
                } else if (
                  response.body &&
                  typeof response.body.pipe === 'function'
                ) {
                  newBufferStringStream = response.body;
                } else {
                  newBufferStringStream = response.content;
                }

                if (response.headers) {
                  knownLength =
                    knownLength || response.getHeader('content-length');
                  const cd = response.getHeader('content-disposition');
                  if (cd) {
                    filename =
                      filename ||
                      contentDisposition.parse(cd).parameters.filename;
                  }
                }
              } else {
                throw new Error(
                  'Cannot stash a Promise wrapped file of unknown type.'
                );
              }

              return uploader(
                result,
                newBufferStringStream,
                knownLength,
                filename,
                fileContentType
              );
            };

            if (isStreamed) {
              return maybeResponse.buffer().then((buffer) => {
                maybeResponse.dataBuffer = buffer;
                return parseFinalResponse(maybeResponse);
              });
            } else {
              return parseFinalResponse(maybeResponse);
            }
          });
        } else {
          return uploader(
            result,
            bufferStringStream,
            knownLength,
            filename,
            fileContentType
          );
        }
      }
    );
  };
};

module.exports = createFileStasher;
