const { flags } = require('@oclif/command');
const { pickBy } = require('lodash');

const baseFlags = {
  format: flags.string({
    char: 'f',
    // TODO make these dynamic
    options: ['plain', 'json', 'raw', 'row', 'table', 'small'],
    default: 'table'
  }),
  debug: flags.boolean({
    char: 'd',
    description: 'Show extra debugging output'
  })
};

// didn't destruture these opts because I want them all on one object to be picked from
const defaultOpts = { debug: true, format: false };
const buildFlags = ({ commandFlags = {}, opts = {} } = {}) => {
  const selectedBaseFlags = Object.assign({}, defaultOpts, opts);
  return Object.assign(
    {},
    commandFlags,
    pickBy(baseFlags, (v, k) => selectedBaseFlags[k])
  );
};
module.exports = buildFlags;
