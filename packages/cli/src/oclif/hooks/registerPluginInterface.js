const { callAPI } = require('../../utils/api');

module.exports = async function () {
  global.callAPI = async (options) => callAPI('', options);
};
