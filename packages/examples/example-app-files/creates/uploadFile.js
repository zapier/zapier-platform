const FormData = require('form-data');

const hydrators = require('../hydrators');

const uploadFile = (z, bundle) => {
  const formData = new FormData();

  formData.append('filename', bundle.inputData.filename);
  formData.append('file', bundle.inputData.file);

  if (bundle.inputData.name) {
    formData.append('name', bundle.inputData.name);
  }

  return z.request({
      url: 'https://zapier.webscript.io/platform-example-app/upload',
      method: 'POST',
      body: formData,
    })
    .then((response) => {
      const file = response.json;

      // Make it possible to get the actual file contents if necessary (no need to make the request now)
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
