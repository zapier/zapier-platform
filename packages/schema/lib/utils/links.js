const _ = require('lodash');

const packageJson = require('../../package.json');
const constants = require('../constants.js');

// From '</SomeSchema>' to 'SomeSchema'.
const filename = (val) => _.trim(String(val), '/<>');

// From '/SomeSchema' to '#someschema'.
const anchor = (val) => '#' + filename(val.toLowerCase());

const makeCodeLink = (id) =>
  `${constants.ROOT_GITHUB}/blob/zapier-platform-schema@${
    packageJson.version
  }/packages/schema/lib/schemas/${filename(id)}.js`;
const makeDocLink = (id) =>
  _.template(constants.DOC_URL_TEMPLATE)({
    version: packageJson.version,
    anchor: anchor(id),
  });

module.exports = {
  filename: filename,
  anchor: anchor,
  makeCodeLink: makeCodeLink,
  makeDocLink: makeDocLink,
};
