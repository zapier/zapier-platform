const _ = require('lodash');

module.exports = _.extend(
  {},
  require('./api'),
  require('./args'),
  require('./build'),
  require('./changelog'),
  require('./context'),
  require('./convert'),
  require('./correct-version'),
  require('./display'),
  require('./files'),
  require('./init'),
  require('./local'),
  require('./misc'),
  require('./promisify')
);
