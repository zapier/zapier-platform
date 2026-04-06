const order = require('./creates/order');

const App = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  creates: {
    [order.key]: order,
  },
};

module.exports = App;
