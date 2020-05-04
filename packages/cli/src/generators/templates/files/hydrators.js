module.exports = {
  downloadFile: async (z, bundle) => {
    // Use standard auth to request the file
    const response = await z.request({
      url: bundle.inputData.url,
      raw: true
    });

    // When `raw` is true, response.body will be a stream, which can be passed
    // to z.stashFile(). z.stashFile() will upload the file to a Zapier-owned S3
    // storage, allowing Zapier to get this file without auth. If your file is
    // publicly available permanently, you may skip z.stashFile().
    const stashedURL = await z.stashFile(response.body);
    return stashedURL;
  }
};
