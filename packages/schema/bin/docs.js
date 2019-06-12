'use strict';

const fs = require('fs');

const constants = require('../lib/constants');

const AppSchema = require('../lib/schemas/AppSchema');
const buildDocs = require('../lib/utils/buildDocs');

fs.writeFileSync(`./${constants.DOCS_PATH}`, buildDocs(AppSchema));
