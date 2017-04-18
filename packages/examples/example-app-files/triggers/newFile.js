const hydrators = require('../hydrators');

const listFiles = (z, bundle) => {
  // `z.console.log()` is similar to `console.log()`.
  z.console.log('console says hello world!');

  // You can build requests and our client will helpfully inject all the variables
  // you need to complete. You can also register middleware to control this.

  // You may return a promise or a normal data structure from any perform method.
  return z.request({
      url: 'http://57b20fb546b57d1100a3c405.mockapi.io/api/files',
    })
    .then((response) => {
      const files = JSON.parse(response.content);

      // Make it possible to get the actual file contents if necessary (no need to make the request now)
      return files.map((file) => {
        file.file = z.dehydrate(hydrators.downloadFile, {
          fileId: file.id,
        });

        return file;
      });
    });
};

// We recommend writing your triggers separate like this and rolling them
// into the App definition at the end.
module.exports = {
  key: 'newFile',

  // You'll want to provide some helpful display labels and descriptions
  // for users. Zapier will put them into the UX.
  noun: 'File',
  display: {
    label: 'New File',
    description: 'Trigger when a new file is added.',
  },

  // `operation` is where the business logic goes.
  operation: {
    perform: listFiles,

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
  },

};
