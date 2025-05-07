import zapier, { defineApp } from 'zapier-platform-core';

import packageJson from '../package.json' with { type: 'json' };

import MovieCreate from './creates/movie.js';
import MovieTrigger from './triggers/movie.js';
import authentication from './authentication.js';
import { addBearerHeader } from './middleware.js';

export default defineApp({
  version: packageJson.version,
  platformVersion: zapier.version,

  authentication,
  beforeRequest: [addBearerHeader],

  triggers: {
    [MovieTrigger.key]: MovieTrigger,
  },

  creates: {
    [MovieCreate.key]: MovieCreate,
  },
}) 