const stashPDFfunction = (z, bundle) => {
  // use standard auth to request the file
  const filePromise = z.request({
    url: bundle.inputData.downloadUrl,
    raw: true
  });
  // and swap it for a stashed URL
  return z.stashFile(filePromise);
};

const pdfList = (z, bundle) => {
  return z
    .request('http://example.com/pdfs.json')
    .then(res => z.JSON.parse(res.content))
    .then(results => {
      return results.map(result => {
        // lazily convert a secret_download_url to a stashed url
        // zapier won't do this until we need it
        result.file = z.dehydrate(stashPDFfunction, {
          downloadUrl: result.secret_download_url
        });
        delete result.secret_download_url;
        return result;
      });
    });
};

const App = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  hydrators: {
    stashPDF: stashPDFfunction
  },

  triggers: {
    new_pdf: {
      noun: 'PDF',
      display: {
        label: 'New PDF',
        description: 'Triggers when a new PDF is added.'
      },
      operation: {
        perform: pdfList
      }
    }
  }
};

module.exports = App;
