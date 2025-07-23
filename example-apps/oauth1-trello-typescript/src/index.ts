import zapier, { defineApp } from 'zapier-platform-core';

import packageJson from '../package.json' with { type: 'json' };

import authentication from './authentication.js';
import { befores, afters } from './middleware.js';

export default defineApp({
  version: packageJson.version,
  platformVersion: zapier.version,

  authentication,
  beforeRequest: [...befores],
  afterResponse: [...afters],

  // Add your triggers here for them to show up!
  triggers: {},

  // Add your creates here for them to show up!
  creates: {},
});
