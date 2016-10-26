const _ = require('lodash');

module.exports = _.extend(
  {},
  require('./context'),
  require('./files'),
  require('./display'),
  require('./api'),
  require('./misc'),
  require('./local'),
  require('./args'),
  require('./build'),
  require('./promisify'),
  require('./init'),
  require('./convert')
);
