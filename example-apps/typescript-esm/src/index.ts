import type { App } from 'zapier-platform-core';
import pkg from 'zapier-platform-core';
const { version: platformVersion } = pkg;

import packageJson from '../package.json' assert { type: 'json' };

import MovieCreate from './creates/movie.js';
import MovieTrigger from './triggers/movie.js';
import authentication from './authentication.js';
import { addBearerHeader } from './middleware.js';

export default {
  version: packageJson.version,
  platformVersion,

  authentication,
  beforeRequest: [addBearerHeader],

  triggers: {
    [MovieTrigger.key]: MovieTrigger,
  },

  creates: {
    [MovieCreate.key]: MovieCreate,
  },
} satisfies App;
