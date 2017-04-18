const hydrators = {
  downloadFile: (z, bundle) => {
    // use standard auth to request the file
    const filePromise = z.request({
      url: `https://zapier.webscript.io/platform-example-app/download?id=${bundle.inputData.fileId}`,
      raw: true
    });

    // and swap it for a stashed URL
    return z.stashFile(filePromise)
      .then((url) => {
        z.console.log(`Stashed URL = ${url}`);
        return url;
      });
  },
};

module.exports = hydrators;
