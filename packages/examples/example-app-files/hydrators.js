const hydrators = {
  downloadFile: (z, bundle) => {
    // use standard auth to request the file
    const filePromise = z.request({
      url: `https://wt-d9eeb64793d8836c8641adb2acda6ed3-0.run.webtask.io/download-file?id=${bundle.inputData.fileId}`,
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
