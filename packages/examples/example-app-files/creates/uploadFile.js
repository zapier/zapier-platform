const request = require('request');
const FormData = require('form-data');

const hydrators = require('../hydrators');

const uploadFile = (z, bundle) => {
  const formData = new FormData();

  formData.append('filename', bundle.inputData.filename);

  // file will in fact be an url where the file data can be downloaded from
  // which we do via a stream created by NPM's request package
  // (form-data doesn't play nicely with z.request)
  formData.append('file', request(bundle.inputData.file));

  if (bundle.inputData.name) {
    formData.append('name', bundle.inputData.name);
  }

  return z.request({
      url: 'https://1i94uigjze.execute-api.us-east-1.amazonaws.com/api/upload',
      method: 'POST',
      body: formData,
    })
    .then((response) => {
      const file = response.json;

      // Make it possible to use the actual uploaded (or online converted)
      // file in a subsequent action. No need to download it now, so again
      // dehydrating like in ../triggers/newFile.js
      file.file = z.dehydrate(hydrators.downloadFile, {
        fileId: file.id,
      });

      return file;
    });
};

module.exports = {
  key: 'uploadFile',
  noun: 'File',
  display: {
    label: 'Upload File',
    description: 'Uploads a file.'
  },
  operation: {
    inputFields: [
      {key: 'name', required: false, type: 'string', label: 'Name', helpText: 'If not defined, the Filename will be copied here.'},
      {key: 'filename', required: true, type: 'string', label: 'Filename'},
      {key: 'file', required: true, type: 'file', label: 'File'},
    ],
    perform: uploadFile,
    sample: {
      id: 1,
      name: 'Example PDF',
      file: 'SAMPLE FILE',
      filename: 'example.pdf',
    },
    outputFields: [
      {key: 'id', type: 'integer', label: 'ID'},
      {key: 'name', type: 'string', label: 'Name'},
      {key: 'filename', type: 'string', label: 'Filename'},
      {key: 'file', type: 'file', label: 'File'},
    ],
  }
};
