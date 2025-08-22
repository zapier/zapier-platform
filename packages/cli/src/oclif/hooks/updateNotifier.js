const { createUpdateNotifier } = require('../../utils/esm-wrapper');
const pkg = require('../../../package.json');
const { UPDATE_NOTIFICATION_INTERVAL } = require('../../constants');

// can't be fat arrow because it inherits `this` from commands
// Made async because createUpdateNotifier() uses dynamic import() to load ESM-only update-notifier package
module.exports = async function (options) {
  const notifier = await createUpdateNotifier({
    // await needed for ESM dynamic import
    pkg,
    updateCheckInterval: UPDATE_NOTIFICATION_INTERVAL,
  });

  notifier.notify({ isGlobal: true });
};
