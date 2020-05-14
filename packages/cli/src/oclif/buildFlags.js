const { flags } = require('@oclif/command');
const { pickBy } = require('lodash');

const { formatStyles } = require('../utils/display');

const baseFlags = {
  format: flags.string({
    char: 'f',
    options: Object.keys(formatStyles),
    default: 'table',
    description:
      'Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq.',
  }),
  debug: flags.boolean({
    char: 'd',
    description: 'Show extra debugging output.',
    // pull from env?
  }),

  // Indicates we're calling a command from another command so we know when not
  // to print duplicate messages.
  invokedFromAnotherCommand: flags.boolean({
    hidden: true,
  }),
};

// didn't destruture these opts because I want them all on one object to be picked from
const defaultOpts = {
  debug: true,
  format: false,
  invokedFromAnotherCommand: true,
};

/**
 * pass in flag objects, plus whether or not to include debug and format
 */
const buildFlags = ({ commandFlags = {}, opts = {} } = {}) => {
  const selectedBaseFlags = Object.assign({}, defaultOpts, opts);
  return Object.assign(
    {},
    commandFlags,
    pickBy(baseFlags, (v, k) => selectedBaseFlags[k])
  );
};
module.exports = { buildFlags };
