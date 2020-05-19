const hydrators = require('../hydrators');

const perform = (z, bundle) => {
  // In reality you're more likely to get file info from a remote server. Here
  // we're hard coding some links just to demonstrate.
  const fileURLs = [
    'https://httpbin.zapier-tooling.com/image/png',
    'https://httpbin.zapier-tooling.com/image/jpeg',
    'https://httpbin.zapier-tooling.com/xml',
  ];

  return fileURLs.map((fileURL) => {
    const fileInfo = {
      id: fileURL,

      // Make it possible to get the actual file contents if necessary. No need
      // to make the request to download files now when the trigger is run.
      file: z.dehydrateFile(hydrators.downloadFile, { url: fileURL }),
    };
    return fileInfo;
  });
};

// We recommend writing your triggers separate like this and rolling them into
// the App definition at the end.
module.exports = {
  key: 'newFile',

  // You'll want to provide some helpful display labels and descriptions
  // for users. Zapier will put them into the UX.
  noun: 'File',
  display: {
    label: 'New File',
    description: 'Triggers when a new file is added.',
  },

  // `operation` is where the business logic goes.
  operation: {
    perform,

    sample: {
      id: 'https://example.com/file.txt',
      file: 'content',
    },
  },
};
