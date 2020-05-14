'use strict';

const constants = require('../constants');

const zid = Math.round(Math.random() * Math.pow(10, 15)).toString(16);
let zrun = 0;

const checkMemory = (event) => {
  event = event || {};

  zrun += 1;
  if (!constants.IS_TESTING && !event.calledFromCli) {
    console.log(
      'ZID:',
      zid,
      'pid',
      'ZRUN:',
      zrun,
      'RSSMEM:',
      process.memoryUsage()
    );
  }

  if (
    zrun > constants.KILL_MIN_LIMIT &&
    process.memoryUsage().rss > constants.KILL_MAX_LIMIT
  ) {
    // should throw "Process exited before completing request"
    // and a @retry in our stack will attempt again - and this
    // process will get restarted
    console.error('Force killing process by Zapier for memory usage');

    /* eslint no-process-exit: 0 */
    process.exit(1);
  }
};

module.exports = checkMemory;
