const zapier = require('./src');
zapier.version = require('./package.json').version;
zapier.Promise = zapier.ZapierPromise = require('./src/tools/promise');
module.exports = zapier;
