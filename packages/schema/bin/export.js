'use strict';

const fs = require('fs');

const schema = require('../schema');
const exportedSchema = schema.exportSchema();

fs.writeFileSync(
  './exported-schema.json',
  JSON.stringify(exportedSchema, null, '  '),
);
