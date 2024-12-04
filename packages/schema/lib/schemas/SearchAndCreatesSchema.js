'use strict';

const makeSchema = require('../utils/makeSchema');

const SearchOrCreatesSchema = require('./SearchOrCreatesSchema');

module.exports = makeSchema(
  {
    ...SearchOrCreatesSchema.schema,
    id: '/SearchAndCreatesSchema',
    description: 'Alias for /SearchOrCreatesSchema',
  },
  [SearchOrCreatesSchema],
);
