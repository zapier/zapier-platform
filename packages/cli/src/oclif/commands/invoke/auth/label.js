const _ = require('lodash');

const { testAuth } = require('./test');

/**
 * Gets the connection label by running authentication.test and rendering the label template.
 * @param {Object} context - The execution context
 * @returns {Promise<string>} The rendered connection label
 */
const getAuthLabel = async (context) => {
  const testResult = await testAuth(context);
  const labelTemplate = (
    context.appDefinition.authentication.connectionLabel ?? ''
  ).replaceAll('__', '.');
  const tpl = _.template(labelTemplate, { interpolate: /{{([\s\S]+?)}}/g });
  return tpl({
    ...testResult,
    bundle: { authData: context.authData, inputData: testResult },
  });
};

module.exports = { getAuthLabel };
