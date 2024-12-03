const fetch = require('node-fetch');
const { BASE_ENDPOINT } = require('../constants');

const isSamlEmail = async (email) => {
  const rawResponse = await fetch(
    `${BASE_ENDPOINT}/api/v4/idp-discovery/?email=${encodeURIComponent(email)}`,
  );
  const { results = [], errors = [] } = await rawResponse.json();
  if (errors.length) {
    throw new Error(errors[0]);
  }
  return results.length > 0;
};

module.exports = { isSamlEmail };
