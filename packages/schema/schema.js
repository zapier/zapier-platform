'use strict';

const exportSchema = require('./lib/utils/exportSchema');

const AppSchema = require('./lib/schemas/AppSchema');

const validateAppDefinition = AppSchema.validate;

module.exports = {
  AppSchema,
  validateAppDefinition,
  exportSchema: () => exportSchema(AppSchema),
};
