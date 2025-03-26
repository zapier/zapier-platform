import type { App } from 'zapier-platform-core';
import { version as platformVersion } from 'zapier-platform-core';

import packageJson from '../package.json';

import MovieCreate from './creates/movie';
import MovieTrigger from './triggers/movie';
import authentication from './authentication';
import { addBearerHeader } from './middleware';

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
