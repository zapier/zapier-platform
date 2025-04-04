'use strict';

//
// This is what file and folder use as a "base"
//

const _ = require('lodash');
const fetch = require('node-fetch');

const utils = require('../utils');
const hydrators = require('../hydrators');
const parseResponse = utils.parseResponse;
const handleError = utils.handleError;
const cleanupPaths = utils.cleanupPaths;
const { BASE_ITEM_URL } = require('../constants');

const getItem = (itemType, z, bundle) => {
  const options = {
    url: `${BASE_ITEM_URL}/me/drive/items/${bundle.inputData.id}`,
  };
  return z
    .request(options)
    .then(_.partial(parseResponse, z, itemType))
    .then((item) => cleanupPaths([item])[0])
    .then((item) => {
      if (item.file) {
        item.fileContents = z.dehydrate(hydrators.getFileContents, {
          id: item.id,
        });
      }

      return item;
    })
    .catch(handleError);
};

const listItems = (itemType, z, bundle) => {
  let folder = bundle.inputData.folder || '';

  if (folder) {
    folder = `:${encodeURIComponent(folder)}:`; // OneDrive's URL format
  }

  const options = {
    url: `${BASE_ITEM_URL}/me/drive/root${folder}/children`,
  };

  return z
    .request(options)
    .then(_.partial(parseResponse, z, itemType))
    .then(cleanupPaths)
    .then((items) => {
      items.forEach((item) => {
        if (item.file) {
          item.fileContents = z.dehydrate(hydrators.getFileContents, {
            id: item.id,
          });
        }
      });

      return items;
    })
    .catch(handleError);
};

const searchItem = (itemType, z, bundle) => {
  let folder = bundle.inputData.folder || '';

  if (folder) {
    folder = `:${encodeURIComponent(folder)}:`; // OneDrive's URL format
  }

  const options = {
    url: `${BASE_ITEM_URL}/me/drive/root${folder}/search(q='${encodeURIComponent(
      bundle.inputData.name,
    )}')`,
  };

  return z
    .request(options)
    .then(_.partial(parseResponse, z, itemType))
    .then(cleanupPaths)
    .catch(handleError);
};

// Note this only works for files, but is here so creates/text-file can reuse it
const handleCreateWithSession = (
  z,
  bundle,
  fileContents,
  fileSize,
  fileContentType,
  folder,
  name,
) => {
  if (folder) {
    folder = encodeURIComponent(folder);
  }

  name = encodeURIComponent(name);

  return z
    .request({
      url: `${BASE_ITEM_URL}/me/drive/root:${folder}/${name}:/createUploadSession`,
      method: 'POST',
      body: {
        item: {
          '@microsoft.graph.conflictBehavior': 'rename',
        },
      },
      headers: {
        'content-type': 'application/json',
      },
    })
    .then((response) => {
      const uploadUrl = response.data.uploadUrl;

      // This should work fine for files up to 60MB (https://dev.onedrive.com/items/upload_large_files.htm#upload-fragments)

      if (!fileContentType.includes('charset')) {
        fileContentType += '; charset=UTF-8';
      }

      // CODE TIP: If you define beforeRequest handlers, then end up in a
      // situation where you don't want that pre-processing, you can drop to a
      // raw `fetch` call instead of the z.request() to avoid those handlers
      return fetch(uploadUrl, {
        method: 'PUT',
        body: fileContents,
        headers: {
          'content-type': fileContentType,
          'content-length': fileSize,
          'content-range': `bytes 0-${fileSize - 1}/${fileSize}`,
        },
      });
    })
    .then((response) => response.text())
    .then((content) => {
      const resourceId = z.JSON.parse(content).id;
      bundle.inputData = {
        id: resourceId,
      };

      return _.partial(getItem, 'file')(z, bundle);
    })
    .catch(handleError);
};

module.exports = {
  getItem,
  listItems,
  searchItem,
  handleCreateWithSession,
};
