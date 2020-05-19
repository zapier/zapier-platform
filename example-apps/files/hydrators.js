module.exports = {
  downloadFile: async (z, bundle) => {
    // Use standard auth to request the file
    const filePromise = z.request({
      url: bundle.inputData.url,
      raw: true,
    });

    // When `raw` is true, the result of z.request() can be passed to
    // z.stashFile(). z.stashFile() will upload the file to a Zapier-owned S3
    // bucket and return a promise of an S3 URL that allows Zapier to get the
    // file without auth. If your file URL is permanently publicly available,
    // you may skip z.stashFile() and return that URL directly here.
    return z.stashFile(filePromise);
  },
};
