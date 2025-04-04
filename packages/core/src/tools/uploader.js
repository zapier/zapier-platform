const path = require('path');

const FormData = require('form-data');
const contentDisposition = require('content-disposition');

const request = require('./request-client-internal');
const LENGTH_ERR_MESSAGE =
  'We could not calculate the length of your file - please ' +
  'pass a knownLength like z.stashFile(f, knownLength)';

const uploader = async (
  signedPostData,
  bufferStringStream,
  knownLength,
  filename,
  contentType,
) => {
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
      'You must provide the Content-Length HTTP header.',
    )
  ) {
    throw new Error(LENGTH_ERR_MESSAGE);
  }

  throw new Error(`Got ${response.status} - ${response.content}`);
};

module.exports = uploader;
