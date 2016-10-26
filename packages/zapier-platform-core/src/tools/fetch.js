'use strict';

// hacky "clone" for fetch so we don't pollute the global library
const fetch = require('node-fetch').bind({});
fetch.Promise = require('./promise');
module.exports = fetch;
