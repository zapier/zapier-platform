'use strict';

const _ = require('lodash');

const constants = require('../../constants');
const errors = require('../../errors');

const checks = _.values(require('../../checks'));

/*
  Take a look at our output results, run some checks on it, and depending on if we
  are running "locally or live" we will "raise or log" the errors, respectively.
*/
const checkOutput = output => {
  const input = output.input || {};
  const _zapier = input._zapier || {};
  const event = _zapier.event || {};

  const runChecks =
    event.method && event.command === 'execute' && !_zapier.skipChecks;

  if (runChecks) {
    const rawResults = checks
      .filter(check => {
        return check.shouldRun(event.method, event.bundle);
      })
      .map(check => {
        return check
          .run(event.method, output.results)
          .map(err => ({ name: check.name, error: err }));
      });
    const checkResults = _.flatten(rawResults);

    if (checkResults.length > 0) {
      if (constants.IS_TESTING || event.isDeveloper || event.calledFromCli) {
        const shortMsgs = checkResults.map(info => `  - ${info.error}`);
        throw new errors.CheckError(
          'Invalid API Response:\n' + shortMsgs.join('\n')
        );
      } else {
        const longMsgs = checkResults.map(
          info => `Zapier check "${info.name}" failed: ${info.error}`
        );
        longMsgs.forEach(err => input.z.console.error(err));
      }
    }
  }
  return output;
};

module.exports = checkOutput;
