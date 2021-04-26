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

    const method = _.get(input, ['_zapier', 'event', 'method'], '');
    const isValidSource =
      method.startsWith('hydrators.') ||
      method.startsWith('creates.') ||
      // key regex from KeySchema
      method.match(/^resources\.[a-zA-Z][a-zA-Z0-9_]*\.create\./);

    if (!isValidSource) {
      return ZapierPromise.reject(
        new Error(
          'Files can only be stashed within a create or hydration function/method.'
        )
      );
    }

    const fileContentType = contentType || DEFAULT_CONTENT_TYPE;

    return rpc('get_presigned_upload_post_data', fileContentType).then(
      (result) => {
        const parseFinalResponse = (stream) => {
          let newBufferStringStream = stream;

          // if stream is string, don't update headers, just return as is
          if (_.isString(stream)) {
            newBufferStringStream = stream;
          } else if (stream) {
            if (Buffer.isBuffer(stream)) {
              newBufferStringStream = stream;
            } else if (Buffer.isBuffer(stream.dataBuffer)) {
              newBufferStringStream = stream.dataBuffer;
            } else if (stream.body && typeof stream.body.pipe === 'function') {
              newBufferStringStream = stream.body;
            } else if (stream.content) {
              newBufferStringStream = stream.content;
            }

            // if stream has headers update knownLength and filename to reflect the header values
            if (stream.headers) {
              knownLength = knownLength || stream.getHeader('content-length');
              const cd = stream.getHeader('content-disposition');
              if (cd) {
                filename =
                  filename || contentDisposition.parse(cd).parameters.filename;
              }
            }
            // if stream is not defined, error
          } else {
            throw new Error('Cannot stash a file of unknown type.');
          }

          // send final response to uploader
          return uploader(
            result,
            newBufferStringStream,
            knownLength,
            filename,
            fileContentType
          );
        };

        const formResponse = (response) => {
          // determine if string is streamed based on if raw:true
          const isStreamed = _.get(response, 'request.raw', false);

          // if it's streamed, buffer first
          if (isStreamed) {
            return response.buffer().then((buffer) => {
              response.dataBuffer = buffer;
              return parseFinalResponse(response);
            });
          } else {
            return parseFinalResponse(response);
          }
        };

        // if stream is a promise, wait until resolved
        if (isPromise(bufferStringStream)) {
          return bufferStringStream.then((maybeResponse) => {
            return formResponse(maybeResponse);
          });
        } else {
          return formResponse(bufferStringStream);
        }
      }
    );
  };
};

module.exports = createFileStasher;
