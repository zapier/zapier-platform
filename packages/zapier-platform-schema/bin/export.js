'use strict';

const fs = require('fs');

const schema = require('../schema');
const exportedSchema = schema.exportSchema();

fs.writeFile('./exported-schema.json', JSON.stringify(exportedSchema, null, '  '));
