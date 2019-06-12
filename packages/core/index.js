const zapier = require('./src');
zapier.version = require('./package.json').version;
zapier.Promise = zapier.ZapierPromise = require('./src/tools/promise');
zapier.tools = require('./src/tools/exported');
module.exports = zapier;
