'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { pipeline } = require('stream');
const { promisify } = require('util');
const { randomBytes } = require('crypto');

const _ = require('lodash');
const contentDisposition = require('content-disposition');
const FormData = require('form-data');
const mime = require('mime-types');

const request = require('./request-client-internal');

const UPLOAD_MAX_SIZE = 1000 * 1000 * 150; // 150mb, in zapier backend too

const LENGTH_ERR_MESSAGE =
  'We could not calculate the length of your file - please ' +
  'pass a knownLength like z.stashFile(f, knownLength)';

const DEFAULT_FILE_NAME = 'unnamedfile';
const DEFAULT_CONTENT_TYPE = 'application/octet-stream';

const streamPipeline = promisify(pipeline);

const filenameFromURL = (url) => {
  try {
    return decodeURIComponent(path.posix.basename(new URL(url).pathname));
  } catch (error) {
    return null;
  }
};

const filenameFromHeader = (response) => {
  const cd = response.headers.get('content-disposition');
  let filename;
  if (cd) {
    try {
      filename = contentDisposition.parse(cd).parameters.filename;
    } catch (error) {
      return null;
    }
  }
  return filename || null;
};

const resolveRemoteStream = async (stream) => {
  // Download to a temp file, get the file size, and create a readable stream
  // from the temp file.
  //
  // The streamPipeline usage is taken from
  // https://github.com/node-fetch/node-fetch#streams
  const tmpFilePath = path.join(
    os.tmpdir(),
    'stash-' + randomBytes(16).toString('hex')
  );

  try {
    await streamPipeline(stream, fs.createWriteStream(tmpFilePath));
  } catch (error) {
    try {
      fs.unlinkSync(tmpFilePath);
    } catch (e) {
      // File doesn't exist? Probably okay
    }
    throw error;
  }

  const length = fs.statSync(tmpFilePath).size;
  const readStream = fs.createReadStream(tmpFilePath);

  readStream.on('end', () => {
    // Burn after reading
    try {
      fs.unlinkSync(tmpFilePath);
    } catch (e) {
      // TODO: We probably want to log warning here
    }
  });

  return {
    streamOrData: readStream,
    length,
  };
};

const resolveResponseToStream = async (response) => {
  // Get filename from content-disposition header or URL
  let filename =
    filenameFromHeader(response) ||
    filenameFromURL(response.url || _.get(response, ['request', 'url'])) ||
    DEFAULT_FILE_NAME;

  const contentType = response.headers.get('content-type');
  if (contentType && !path.extname(filename)) {
    const ext = mime.extension(contentType);
    if (ext && ext !== 'bin') {
      filename += '.' + ext;
    }
  }

  if (response.body && typeof response.body.pipe === 'function') {
    // streamable response created by z.request({ raw: true })
    return {
      ...(await resolveRemoteStream(response.body)),
      contentType: contentType || DEFAULT_CONTENT_TYPE,
      filename,
    };
  }

  // regular response created by z.request({ raw: false })
  return {
    streamOrData: response.content,
    length: Buffer.byteLength(response.content),
    contentType: contentType || DEFAULT_CONTENT_TYPE,
    filename,
  };
};

const resolveStreamWithMeta = async (stream) => {
  const isLocalFile = stream.path && fs.existsSync(stream.path);
  if (isLocalFile) {
    const filename = path.basename(stream.path);
    return {
      streamOrData: stream,
      length: fs.statSync(stream.path).size,
      contentType: mime.lookup(filename) || DEFAULT_CONTENT_TYPE,
      filename,
    };
  }

  return {
    ...(await resolveRemoteStream(stream)),
    contentType: DEFAULT_CONTENT_TYPE,
    filename: DEFAULT_FILE_NAME,
  };
};

// Returns an object with fields:
// * streamOrData: a readable stream, a string, or a Buffer
// * length: content length in bytes
// * contentType
// * filename
const resolveToBufferStringStream = async (responseOrData) => {
  if (typeof responseOrData === 'string' || responseOrData instanceof String) {
    // The .toString() call only makes a difference for the String object case.
    // It converts a String object to a regular string.
    const str = responseOrData.toString();
    return {
      streamOrData: str,
      length: Buffer.byteLength(str),
      contentType: 'text/plain',
      filename: `${DEFAULT_FILE_NAME}.txt`,
    };
  } else if (Buffer.isBuffer(responseOrData)) {
    return {
      streamOrData: responseOrData,
      length: responseOrData.length,
      contentType: DEFAULT_CONTENT_TYPE,
      filename: DEFAULT_FILE_NAME,
    };
  } else if (
    (responseOrData.body && typeof responseOrData.body.pipe === 'function') ||
    typeof responseOrData.content === 'string'
  ) {
    return resolveResponseToStream(responseOrData);
  } else if (typeof responseOrData.pipe === 'function') {
    return resolveStreamWithMeta(responseOrData);
  }

  throw new TypeError(
    `z.stashFile() cannot stash type '${typeof responseOrData}'. ` +
      'Pass it a request, readable stream, string, or Buffer.'
  );
};

const uploader = async (
  signedPostData,
  bufferStringStream,
  knownLength,
  filename,
  contentType
) => {
  if (knownLength && knownLength > UPLOAD_MAX_SIZE) {
    throw new Error(`${knownLength} is too big, ${UPLOAD_MAX_SIZE} is the max`);
  }
  filename = path.basename(filename).replace('"', '');

  const fields = {
    ...signedPostData.fields,
    'Content-Disposition': contentDisposition(filename),
    'Content-Type': contentType,
  };

  const form = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    form.append(key, value);
  });

  form.append('file', bufferStringStream, {
    knownLength,
    contentType,
    filename,
  });

  // Try to catch the missing length early, before upload to S3 fails.
  try {
    form.getLengthSync();
  } catch (err) {
    throw new Error(LENGTH_ERR_MESSAGE);
  }

  // Send to S3 with presigned request.
  const response = await request({
    url: signedPostData.url,
    method: 'POST',
    body: form,
  });

  if (response.status === 204) {
    return new URL(signedPostData.fields.key, signedPostData.url).href;
  }

  if (
    response.content &&
    response.content.includes &&
    response.content.includes(
      'You must provide the Content-Length HTTP header.'
    )
  ) {
    throw new Error(LENGTH_ERR_MESSAGE);
  }

  throw new Error(`Got ${response.status} - ${response.content}`);
};

// Designed to be some user provided function/api.
const createFileStasher = (input) => {
  const rpc = _.get(input, '_zapier.rpc');

  return async (requestOrData, knownLength, filename, contentType) => {
    // TODO: maybe this could be smart?
    // if it is already a public url, do we pass through? or upload?
    if (!rpc) {
      throw new Error('rpc is not available');
    }

    const isRunningOnHydrator = _.get(
      input,
      '_zapier.event.method',
      ''
    ).startsWith('hydrators.');
    const isRunningOnCreate = _.get(
      input,
      '_zapier.event.method',
      ''
    ).startsWith('creates.');

    if (!isRunningOnHydrator && !isRunningOnCreate) {
      throw new Error(
        'Files can only be stashed within a create or hydration function/method.'
      );
    }

    // requestOrData can be one of these:
    // * string
    // * Buffer
    // * z.request() - a Promise of a regular response
    // * z.request({ raw: true }) - a Promise of a "streamable" response
    // * await z.request() - a regular response
    // * await z.request({ raw: true }) - a streamable response
    //
    // After the following, requestOrData is resolved to responseOrData, which
    // is either:
    // - string
    // - Buffer
    // - a regular response
    // - a streamable response
    const [signedPostData, responseOrData] = await Promise.all([
      rpc('get_presigned_upload_post_data'),
      requestOrData,
    ]);

    if (responseOrData.throwForStatus) {
      responseOrData.throwForStatus();
    }

    const {
      streamOrData,
      length,
      contentType: _contentType,
      filename: _filename,
    } = await resolveToBufferStringStream(responseOrData);

    return uploader(
      signedPostData,
      streamOrData,
      knownLength || length,
      filename || _filename,
      contentType || _contentType
    );
  };
};

module.exports = createFileStasher;
