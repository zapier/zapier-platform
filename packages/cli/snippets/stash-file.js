const stashPDFfunction = (z, bundle) => {
  // use standard auth to request the file
  const filePromise = z.request({
    url: bundle.inputData.downloadUrl,
    raw: true,
  });
  // and swap it for a stashed URL
  return z.stashFile(filePromise);
};

const pdfList = async (z, bundle) => {
  const response = await z.request('https://example.com/pdfs.json');

  // response.throwForStatus() if you're using core v9 or older

  // response.json.map if you're using core v9 or older
  return response.data.map((pdf) => {
    // Lazily convert a secret_download_url to a stashed url
    // zapier won't do this until we need it
    pdf.file = z.dehydrateFile(stashPDFfunction, {
      downloadUrl: pdf.secret_download_url,
    });
    delete pdf.secret_download_url;
    return pdf;
  });
};

const App = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  hydrators: {
    stashPDF: stashPDFfunction,
  },

  triggers: {
    new_pdf: {
      noun: 'PDF',
      display: {
        label: 'New PDF',
        description: 'Triggers when a new PDF is added.',
      },
      operation: {
        perform: pdfList,
      },
    },
  },
};

module.exports = App;
