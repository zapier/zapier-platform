import { loadBabel } from './tools';
loadBabel();

const exampleFunc = async (z, bundle) => {
  const response = await z.request('http://example.com/api.json');
  return z.json.parse(response.content);
};

const Recipe = require('./resources/recipe');

const authentication = require('./authentication');

const App = {
  version: require('../package.json').version,
  platformVersion: require('zapier-platform-core').version,

  authentication: authentication,

  beforeRequest: [
  ],

  afterResponse: [
  ],

  resources: {
    [Recipe.key]: Recipe,
  },

  triggers: {
  },

  searches: {
  },

  creates: {
  }
};

export default App;
