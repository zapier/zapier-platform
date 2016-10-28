import { loadBabel } from './tools';
loadBabel();

const exampleFunc = async (z, bundle) => {
  const response = await z.request('http://example.com/api.json');
  return z.json.parse(response.content);
};

const App = {
  version: require('../package.json').version,
  platformVersion: require('zapier-platform-core').version,

  beforeRequest: [
  ],

  afterResponse: [
  ],

  resources: {
  },

  triggers: {
  },

  searches: {
  },

  creates: {
  }
};

export default App;
