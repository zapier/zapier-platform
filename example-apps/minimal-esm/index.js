import { version as packageVersion } from './package.json';
import { version as platformVersion } from 'zapier-platform-core';

export default {
  // This is just shorthand to reference the installed dependencies you have.
  // Zapier will need to know these before we can upload.
  version: packageVersion,
  platformVersion: platformVersion,

  // If you want your trigger to show up, you better include it here!
  triggers: {},

  // If you want your searches to show up, you better include it here!
  searches: {},

  // If you want your creates to show up, you better include it here!
  creates: {},

  resources: {},
};
