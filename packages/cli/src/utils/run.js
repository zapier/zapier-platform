const fs = require('fs');
const path = require('path');

const authFieldsFromProcessEnv = () => {
  const phrases = [
    /.*api.*key.*/i,
    /.*access.*token.*/i,
    /.*token.*/i,
    /.*user.*name.*/i,
    /.*password.*/i,
  ];
  const authFields = {};
  phrases.forEach((phrase) => {
    Object.keys(process.env).forEach((key) => {
      if (key.match(phrase)) authFields[key] = process.env[key];
    });
  });

  return authFields;
};

const parseAuth = (type, authInput) => {
  // try to grab some sensible auth looking defaults - should really use the auth that is specified by the user
  let auth = authFieldsFromProcessEnv();

  // override any of the environment variables with the ones provided via the command line
  if (authInput) {
    auth = { ...auth, ...JSON.parse(authInput) };
  }
  return auth;
};

const parseInput = (type, actionKey, input) => {
  let inputParams = {};

  // read the input from a json file if provided
  const inputDataPath = path.join(process.cwd(), 'run-input.json');
  if (fs.existsSync(inputDataPath)) {
    const testInputData = require(inputDataPath);
    if (type in testInputData && actionKey in testInputData[type]) {
      inputParams = testInputData[type][actionKey];
    }
  }

  // or provide JSON via the commandline, overriding any values from the run input file
  if (input) {
    inputParams = { ...inputParams, ...JSON.parse(input) };
  }

  return inputParams;
};

module.exports = {
  authFieldsFromProcessEnv,
  parseAuth,
  parseInput,
};
