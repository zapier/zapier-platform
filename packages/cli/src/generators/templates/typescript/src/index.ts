import type { App, BeforeRequestMiddleware } from 'zapier-platform-core';

import MovieCreate from './creates/movie';
import MovieTrigger from './triggers/movie';
import { version as platformVersion } from 'zapier-platform-core';

import packageJson from '../package.json';

const addApiKeyHeader: BeforeRequestMiddleware = (req, z, bundle) => {
  // Hard-coded api key just to demo. DON'T do auth like this for your production app!
  req.headers = req.headers || {};
  req.headers['X-Api-Key'] = 'secret';
  return req;
};

export default {
  version: packageJson.version,
  platformVersion,

  beforeRequest: [addApiKeyHeader],

  triggers: {
    [MovieTrigger.key]: MovieTrigger,
  },

  creates: {
    [MovieCreate.key]: MovieCreate,
  },
} satisfies App;
