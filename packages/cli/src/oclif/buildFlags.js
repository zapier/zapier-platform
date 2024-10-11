const { Flags } = require('@oclif/core');
const { pickBy } = require('lodash');

const { formatStyles } = require('../utils/display');

const baseFlags = {
  debug: Flags.boolean({
    char: 'd',
    description: 'Show extra debugging output.',
    // pull from env?
  }),
  format: Flags.string({
    char: 'f',
    options: Object.keys(formatStyles),
    default: 'table',
    description:
      'Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq.',
  }),
  // Indicates we're calling a command from another command so we know when not
  // to print duplicate messages.
  invokedFromAnotherCommand: Flags.boolean({
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
 * pass in flag objects, plus whether or not to include debug, format, and
 * invokedFormatAnotherCommand.
 */
const buildFlags = ({ commandFlags = {}, opts = {} } = {}) => {
  const options = { ...defaultOpts, ...opts };
  const pickedFlags = pickBy(baseFlags, (_v, k) => options[k]);
  return { ...commandFlags, ...pickedFlags };
};

module.exports = { buildFlags };
