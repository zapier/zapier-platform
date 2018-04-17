import Authentication from './authentication';
import Recipe from './resources/recipe';
import { version } from '../package.json';
import { version as platformVersion } from 'zapier-platform-core';

const App = {
  version,
  platformVersion,

  authentication: Authentication,

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
