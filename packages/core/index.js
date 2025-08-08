const zapier = require('./src');
zapier.version = require('./package.json').version;
zapier.tools = require('./src/tools/exported');
zapier.errors = require('./src/errors');
zapier.console = require('./src/tools/console-singleton').consoleProxy;
module.exports = zapier;
