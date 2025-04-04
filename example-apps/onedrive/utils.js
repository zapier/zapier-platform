'use strict';

const _ = require('lodash');
const fetch = require('node-fetch');
const contentDisposition = require('content-disposition');

// CODE TIP: This function is used to process the response of several endpoints
// on the OneDrive API. We intentionally don't set it up as an `afterResposne`
// handler because not *all* calls need it (i.e. the auth test and file create),
// so we break it out and share the code this way instead.
const parseResponse = (z, type, response) => {
  let results = [];

  if (response.status >= 200 && response.status < 300) {
    results = response.data;

    // OneDrive puts the contents of lists inside .value property
    if (!_.isArray(results) && _.isArray(results.value)) {
      results = results.value;
    }
  } else {
    throw new z.errors.Error(response.content, null, response.status);
  }

  // Only return files or folders, according to type
  if (_.isArray(results)) {
    results = results.filter((result) => result[type]);
  } else {
    if (!results[type]) {
      results = {};
    }
  }

  return results;
};

const handleError = (error) => {
  if (typeof error === 'string') {
    throw new Error(error);
  }

  throw error;
};

const extractParentsFromPath = (path) => {
  const parts = path.split('/');
  const results = [];

  parts.splice(parts.length - 1); // Last is the current directory, so we remove it

  let i = parts.length - 1;

  while (parts.length > 0) {
    const name = parts.splice(i)[0];

    const result = {
      id: (i + 1) * -1,
      name: name === '' ? '/' : name,
      _path: parts.join('/') + (name === '' ? name : `/${name}`),
      folder: {},
    };

    results.push(result);

    i -= 1;
  }

  results.reverse();

  return results;
};

// UX TIP: Sometimes it can be helpful to translate raw values from an API into
// terms that end users are familiar with. In this example, OneDrive returns
// parent and the path of a file with a '/drive/root:' that end users of OneDrive
// never see. To help it read better in a dynamic dropdown, we clean that off
const cleanupPaths = (results) => {
  // We can get a single object here as well
  if (!_.isArray(results)) {
    results._parent = _.get(results, 'parentReference.path', '').replace(
      '/drive/root:',
      '',
    );
    results._path = `${results._parent}/${results.name}`;
    return results;
  }

  // Adds easier to reference paths, cleaning up the "/drive/root:" clutter
  return results.map((result) => {
    result._parent = _.get(result, 'parentReference.path', '').replace(
      '/drive/root:',
      '',
    );
    result._path = `${result._parent}/${result.name}`;
    return result;
  });
};

const getFileDetailsFromRequest = (url) =>
  new Promise((resolve, reject) => {
    const fileDetails = {
      filename: '',
      size: 0,
      content: '',
      contentType: '',
    };

    fetch(url)
      .then((response) => {
        fileDetails.size = response.headers.get('content-length');
        fileDetails.contentType = response.headers.get('content-type');
        const disposition = response.headers.get('content-disposition');

        if (disposition) {
          fileDetails.filename =
            contentDisposition.parse(disposition).parameters.filename;
        }

        return response.buffer();
      })
      .then((content) => {
        fileDetails.content = content;

        return resolve(fileDetails);
      })
      .catch(reject);
  });

const getStringByteSize = (string) => Buffer.byteLength(string, 'utf8');

module.exports = {
  parseResponse,
  handleError,
  extractParentsFromPath,
  cleanupPaths,
  getFileDetailsFromRequest,
  getStringByteSize,
};
