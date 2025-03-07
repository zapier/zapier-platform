const zapier = require('./src');
zapier.version = require('./package.json').version;
zapier.tools = require('./src/tools/exported');
module.exports = zapier;
