const _ = require('lodash');
const display = require('./display');

const globalArgOptsSpec = {
  format: {help: 'display format', choices: Object.keys(display.formatStyles), default: 'table'},
  help: {help: 'prints this help text', flag: true},
  debug: {help: 'print debug API calls and tracebacks', flag: true},
};

const quoteStr = (s) => String(s || '').indexOf(' ') === -1 ? s : `"${s}"`;
const choicesStr = (choices) => `{${choices.map(String).join(',')}}`;

// Turn process.argv into args/opts.
const argParse = (argv) => {
  const args = [], opts = {};
  argv.forEach((arg) => {
    if (arg.startsWith('--')) {
      const key = arg.split('=', 1)[0].replace('--', '');
      let val = arg.split('=').slice(1).join('=');
      if (val === '') {
        val = true;
      } else if (val.toLowerCase() === 'false') {
        val = false;
      }
      opts[key] = val;
    } else if (arg.startsWith('-') && arg.length === 2) {
      // single letter
      opts[arg[1]] = true;
    } else {
      args.push(arg);
    }
  });
  return [args, opts];
};

// Given a spec and args/opts - return an array of errors.
const enforceArgSpec = (fullSpec, args, argOpts) => {
  const argsSpec = fullSpec.argsSpec || [];
  const argOptsSpec = fullSpec.argOptsSpec || {};

  const errors = [];
  let restAfter = -1;

  const _argLookback = {};

  // Make sure the spec has the provided args.
  _.forEach(argsSpec, (spec, i) => {
    let arg = args[i];

    _argLookback[spec.name] = arg;

    let missingCurrent = spec.required && !arg;
    let missingLookback = (
      !arg && // is absent (but that could be fine)!
      (spec.requiredWith || []).length && // has required friends!
      _.every(spec.requiredWith, (name) => _argLookback[name]) // friends are missing!
    );
    if (missingCurrent || missingLookback) {
      errors.push(`Missing required positional argument ${i + 1}/${spec.name}`);
    }
    if (arg && spec.choices && spec.choices.length && spec.choices.indexOf(arg) === -1) {
      let choices = choicesStr(spec.choices);
      errors.push(`Unexpected positional argument ${i + 1}/${spec.name} of ${quoteStr(arg)}, must be one of ${choices}`);
    }

    restAfter = i;
    if (spec.rest) {
      restAfter = 1000;
    }
  });

  // Make sure any leftover provided args are expected.
  _.forEach(args, (arg, i) => {
    if (i > restAfter) {
      errors.push(`Unexpected positional argument ${i + 1} of ${quoteStr(arg)}`);
    }
  });

  // Make sure the spec has the provided args opts/keywords.
  _.forEach(argOptsSpec, (spec, name) => {
    let arg = argOpts[name];

    if (spec.flag && arg && arg !== true) {
      errors.push(`Unexpected keyword argument with value --${name}`);
      return;
    }

    if (spec.required && !arg) {
      errors.push(`Missing required keyword argument --${name}=${quoteStr(arg || spec.example || 'value')}`);
    }

    if (arg && spec.choices && spec.choices.length && spec.choices.indexOf(arg) === -1) {
      let choices = choicesStr(spec.choices);
      errors.push(`Unexpected keyword argument --${name}=${quoteStr(arg)}, must be one of ${choices}`);
    }
  });

  // Make sure any leftover provided args opts/keywords are expected.
  _.forEach(argOpts, (arg, name) => {
    if (!argOptsSpec[name]) {
      if (arg === true) {
        errors.push(`Unexpected keyword argument --${name}`);
      } else {
        errors.push(`Unexpected keyword argument --${name}=${quoteStr(arg)}`);
      }
    }
  });

  return errors;
};


// Make a markdown list for args.
const argsFragment = (argsSpec) => {
  return _.map(argsSpec, (spec) => {
    let val = spec.example || 'value';
    val = (spec.choices && spec.choices.length) ? choicesStr(spec.choices) : val;
    let def = spec.default ? `. Default is \`${spec.default}\`` : '';
    return `* \`${spec.name} [${quoteStr(val)}]\` -- ${spec.required ? '**required**' : '_optional_'}, ${spec.help || ''}${def}`;
  }).join('\n').trim();
};

// Make a markdown list for args opts/keywords.
const argOptsFragment = (argOptsSpec) => {
  return _.map(argOptsSpec, (spec, name) => {
    let val = spec.example || spec.default || 'value';
    val = (spec.choices && spec.choices.length) ? choicesStr(spec.choices) : val;
    val = spec.flag ? '' : `=${quoteStr(val)}`;
    let def = spec.default ? `. Default is \`${spec.default}\`` : '';
    return `* \`--${name}${val}\` -- ${spec.required ? '**required**' : '_optional_'}, ${spec.help || ''}${def}`;
  }).join('\n').trim();
};

const defaultArgOptsFragment = () => argOptsFragment(globalArgOptsSpec);


module.exports = {
  argOptsFragment,
  argParse,
  argsFragment,
  defaultArgOptsFragment,
  enforceArgSpec,
  globalArgOptsSpec,
};
