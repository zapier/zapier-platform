import fs from 'fs';
import zapier from 'zapier-platform-core';

import recipeTrigger from './triggers/recipe.js';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

export default {
  // This is just shorthand to reference the installed dependencies you have.
  // Zapier will need to know these before we can upload.
  version: packageJson.version,
  platformVersion: zapier.version,

  triggers: {
    [recipeTrigger.key]: recipeTrigger,
  },
  creates: {},
  searches: {},
};
