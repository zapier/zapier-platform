'use strict';

const utils = require('./utils');
const handleError = utils.handleError;
const getStringByteSize = utils.getStringByteSize;
const {
  BASE_ITEM_URL,
  BIG_FILE_MSG,
  BINARY_CONTENT_MSG,
} = require('./constants');

const getFileContents = (z, bundle) => {
  const options = {
    url: `${BASE_ITEM_URL}/me/drive/items/${bundle.inputData.id}/content`,
  };

  return z
    .request(options)
    .then((response) => {
      const fileContents = response.content;
      const fileSize = getStringByteSize(fileContents);

      // UX TIP: It's good to be mindful of how users will consume the outputs
      // of your app and how those outputs travel through Zapier.
      // In this scenario, users asked for the full content of a file so they
      // could map it into the body of an email vs. adding it as an attachment.
      // Cool workflow, but there are limits to passing around large payloads.
      // Here we compromise and hydrate the full content of the file for the
      // user, but only allow it through if it's under a sane size limit. That
      // way we don't send MBs of text through Zapier in every task. Note that
      // this does not prevent the user from transfering large files in Zaps, as
      // file fields are handled differently. This is specifically around our
      // app providing a field that the user wants to map into text inputs in
      // other Actions.
      if (fileSize >= 100 * 1024) {
        return BIG_FILE_MSG;
      }

      try {
        return decodeURIComponent(fileContents);
      } catch (e) {
        return BINARY_CONTENT_MSG;
      }
    })
    .catch(handleError);
};

module.exports = {
  getFileContents,
};
