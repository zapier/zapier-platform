'use strict';

const _ = require('lodash');

const utils = require('../utils');
const parseResponse = utils.parseResponse;
const handleError = utils.handleError;
const cleanupPaths = utils.cleanupPaths;
const extractParentsFromPath = utils.extractParentsFromPath;
const { BASE_ITEM_URL } = require('../constants');
const baseItem = require('./base-item');

const getFolder = _.partial(baseItem.getItem, 'folder');

const listFolders = (z, bundle) => {
  return baseItem.listItems('folder', z, bundle).then((results) => {
    // Add parents when being called in the context of populating a dynamic dropdown (prefill).
    // This allows users to "navigate back" to previous dirs in the Zap Editor
    if (bundle.meta.prefill && bundle.inputData.folder) {
      const parents = extractParentsFromPath(bundle.inputData.folder);
      parents.forEach((result) => results.unshift(result));
    }

    return results;
  });
};

const createFolder = (z, bundle) => {
  let folder = bundle.inputData.folder || '';

  if (folder) {
    folder = `:${encodeURIComponent(folder)}:`; // OneDrive URI format
  }

  return z
    .request({
      url: `${BASE_ITEM_URL}/me/drive/root${folder}/children`,
      method: 'POST',
      body: {
        name: bundle.inputData.name,
        folder: {}, // This tells OneDrive it's a folder (https://dev.onedrive.com/items/create.htm#example)
        '@microsoft.graph.conflictBehavior': 'rename',
      },
      headers: {
        'content-type': 'application/json',
      },
    })
    .then(_.partial(parseResponse, z, 'folder'))
    .then(cleanupPaths)
    .catch(handleError);
};

const searchFolder = _.partial(baseItem.searchItem, 'folder');

module.exports = {
  key: 'folder',
  noun: 'Folder',

  get: {
    display: {
      label: 'Get Folder',
      description: 'Gets a folder.',
    },
    operation: {
      inputFields: [
        {
          key: 'id',
          required: true,
        },
      ],
      perform: getFolder,
    },
  },

  // Will become a trigger on the app. Key will be `folderList`
  list: {
    display: {
      label: 'New Folder',
      description: 'Triggers when a new folder is added.',
    },
    operation: {
      inputFields: [
        {
          key: 'folder',
          type: 'string',
          label: 'Folder',
          required: false,
          // As mentioned above, triggers genereated from resources follow a
          // format of `<resource.key>List`, so that is what we use in all the dynamic dropdowns
          dynamic: 'folderList._path.name',
          helpText:
            'Folder where to look for the folder. Keep clicking the dropdown to go inside folders. Defaults to the top-level folder if left blank.',
        },
      ],
      perform: listFolders,
    },
  },

  // Will become a create on the app. Key will be `folderCreate`
  create: {
    display: {
      label: 'Create Folder',
      description: 'Creates a new folder.',
    },
    operation: {
      inputFields: [
        {
          key: 'folder',
          type: 'string',
          label: 'Folder',
          required: false,
          dynamic: 'folderList._path.name',
          helpText:
            'Folder where to create the folder. Keep clicking the dropdown to go inside folders. Defaults to the top-level folder if left blank.',
        },
        {
          key: 'name',
          required: true,
          type: 'string',
        },
      ],
      perform: createFolder,
    },
  },

  // Will become a search on the app. Key will be `folderSearch`
  search: {
    display: {
      label: 'Find Folder',
      description: 'Finds a folder by name.',
    },
    operation: {
      inputFields: [
        {
          key: 'folder',
          type: 'string',
          label: 'Folder',
          required: false,
          dynamic: 'folderList._path.name',
          helpText:
            'Folder where to look for the folder. Keep clicking the dropdown to go inside folders. Defaults to the top-level folder if left blank.',
        },
        {
          key: 'name',
          required: true,
          type: 'string',
        },
      ],
      perform: searchFolder,
    },
  },

  sample: {
    id: '1',
    name: 'Example',
    _path: '/Something/Example',
    _parent: '/Something',
    webUrl: 'https://example.com',
    createdDateTime: '2016-09-16T03:37:04.72Z',
    lastModifiedDateTime: '2016-09-16T03:37:04.72Z',
  },

  outputFields: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Folder Name' },
    { key: '_path', label: 'Folder Path' },
    { key: '_parent', label: 'Parent Folder' },
    { key: 'webUrl', label: 'URL' },
  ],
};
