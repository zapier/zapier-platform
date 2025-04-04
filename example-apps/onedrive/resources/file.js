'use strict';

const _ = require('lodash');

const utils = require('../utils');
const handleError = utils.handleError;
const getFileDetailsFromRequest = utils.getFileDetailsFromRequest;
const baseItem = require('./base-item');

const getFile = _.partial(baseItem.getItem, 'file');

const listFiles = _.partial(baseItem.listItems, 'file');

const createFile = (z, bundle) => {
  const folder = bundle.inputData.folder || '';
  // NOTE: `file` is really a URL like "https://zapier.com/engine/hydrate/<unique_id>/.blahblahblah:blah:blah/"
  const file = bundle.inputData.file;

  return getFileDetailsFromRequest(file)
    .then((fileDetails) => {
      const name =
        bundle.inputData.name || fileDetails.filename || 'unnamedfile.unknown';

      return baseItem.handleCreateWithSession(
        z,
        bundle,
        fileDetails.content,
        fileDetails.size,
        fileDetails.contentType,
        folder,
        name,
      );
    })
    .catch(handleError);
};

const searchFile = _.partial(baseItem.searchItem, 'file');

module.exports = {
  key: 'file',
  noun: 'File',

  get: {
    display: {
      label: 'Get File',
      description: 'Gets a file.',
    },
    operation: {
      inputFields: [
        {
          key: 'id',
          required: true,
        },
      ],
      perform: getFile,
    },
  },

  // Will become a trigger on the app. Key will be `fileList`
  list: {
    display: {
      label: 'New File',
      description: 'Triggers when a new file is added in a folder.',
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
            'Folder where to look for the file. Keep clicking the dropdown to go inside folders. Defaults to the top-level folder if left blank.',
        },
      ],
      perform: listFiles,
    },
  },

  // Will become a create on the app. Key will be `fileCreate`
  create: {
    display: {
      label: 'Upload File',
      description: 'Upload an existing file or attachment.',
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
            'Folder where to place the file. Keep clicking the dropdown to go inside folders. Defaults to the top-level folder if left blank.',
        },
        {
          key: 'file',
          type: 'file',
          label: 'File',
          required: true,
          helpText:
            'Must be a file object from another service (or some text or URL).',
        },
        {
          key: 'name',
          type: 'string',
          label: 'File Name',
          required: false,
          helpText:
            'By default, we use the same name and extension as the original file.',
        },
      ],
      perform: createFile,
    },
  },

  // Will become a search on the app. Key will be `fileSearch`
  search: {
    display: {
      label: 'Find File',
      description: 'Finds a file by name.',
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
            'Folder where to look for the file. Keep clicking the dropdown to go inside folders. Defaults to the top-level folder if left blank.',
        },
        {
          key: 'name',
          required: true,
          type: 'string',
        },
      ],
      perform: searchFile,
    },
  },

  sample: {
    id: '1',
    name: 'Example.jpg',
    _path: '/Something/Example.jpg',
    _parent: '/Something',
    webUrl: 'https://example.com',
    '@microsoft.graph.downloadUrl': 'https://example.com',
    createdDateTime: '2016-09-16T03:37:04.72Z',
    lastModifiedDateTime: '2016-09-16T03:37:04.72Z',
  },

  outputFields: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'File Name' },
    { key: '_path', label: 'File Path' },
    { key: '_parent', label: 'Folder' },
    { key: 'webUrl', label: 'URL' },
    { key: '@microsoft.graph.downloadUrl', label: 'Download URL' },
  ],
};
