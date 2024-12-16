'use strict';

const utils = require('../utils');
const getStringByteSize = utils.getStringByteSize;
const baseItem = require('../resources/base-item');
const fileResource = require('../resources/file');

const createTextFile = (z, bundle) => {
  const folder = bundle.inputData.folder || '';
  let name = `${bundle.inputData.name}.txt`;

  // Remove potential duplicate extension
  if (name.endsWith('.txt.txt')) {
    name = name.slice(0, -4);
  }

  const fileSize = getStringByteSize(bundle.inputData.file);
  const contentType = 'text/plain; charset=UTF-8';

  return baseItem.handleCreateWithSession(
    z,
    bundle,
    bundle.inputData.file,
    fileSize,
    contentType,
    folder,
    name,
  );
};

module.exports = {
  key: 'textFile',
  noun: 'Text File',

  display: {
    label: 'Create New Text File',
    description:
      'Creates a brand new text file from plain text content you specify.',
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
        type: 'text',
        label: 'File',
        required: true,
        helpText: 'Plain text content to put inside the new text file.',
      },
      {
        key: 'name',
        type: 'string',
        label: 'Name of New File',
        required: true,
        helpText:
          'Specify the name of this file. ".txt" will always be appended.',
      },
    ],

    perform: createTextFile,

    // CODE TIP: If you define a resource and additional operations on that
    // resource, you can simply import the resource and re-use parts of the
    // definition in the other operations, like here. In this case, creating a
    // text file and uploading a file are the same endpoint in the OneDrive API
    // so the sample and output are the same for each.
    sample: fileResource.sample,

    outputFields: fileResource.outputFields,
  },
};
