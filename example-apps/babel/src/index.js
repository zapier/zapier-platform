import Authentication from './authentication';
import Recipe from './resources/recipe';
import { version } from '../package.json';
import { version as platformVersion } from 'zapier-platform-core';

const errorHandler = response => {
  if (response.status === 401) {
    throw new Error('The username and/or password you supplied is incorrect');
  }

  response.throwForStatus();

  return response;
};

const App = {
  version,
  platformVersion,

  authentication: Authentication,

  beforeRequest: [],

  afterResponse: [errorHandler],

  resources: {
    [Recipe.key]: Recipe
  },

  triggers: {},

  searches: {},

  creates: {}
};

export default App;
