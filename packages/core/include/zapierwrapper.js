// not intended to be loaded via require() - copied during build step
const path = require('path');
const zapier = require('zapier-platform-core');
const appPath = path.resolve(__dirname, 'index.js');
// don't `require(appPath)` out here
module.exports = { handler: zapier.createAppHandler(appPath) };
