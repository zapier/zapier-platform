const updateNotifier = require('update-notifier');
const pkg = require('../../../package.json');
const { UPDATE_NOTIFICATION_INTERVAL } = require('../../constants');

// can't be fat arrow because it inherits `this` from commands
module.exports = function (options) {
  const notifier = updateNotifier({
    pkg,
    updateCheckInterval: UPDATE_NOTIFICATION_INTERVAL,
  });

  notifier.notify({ isGlobal: true });
};
