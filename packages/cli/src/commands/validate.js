const _ = require('lodash');
const colors = require('colors/safe');

const utils = require('../utils');

// shadow of engine/style_checker/_condense_issues
const condenseIssues = styleResult => {
  let res = [];
  const docURL =
    'https://zapier.com/developer/documentation/v2/style-checks-reference';
  for (const severity in styleResult) {
    for (const type in styleResult[severity]) {
      for (const method in styleResult[severity][type]) {
        // for ... of becaues this is an array finally
        for (const message of styleResult[severity][type][method]) {
          res.push({
            category: severity,
            method: `${type}.${method}`,
            description: message,
            link: `${docURL}#${message.substr(-7, 6)}`
          });
        }
      }
    }
  }

  return res;
};

const validate = async context => {
  context.line('\nValidating project locally.');
  const errors = await utils.localAppCommand({ command: 'validate' });

  const newErrors = errors.map(error => {
    error = _.extend({}, error);
    error.property = error.property.replace('instance.', 'App.');
    error.docLinks = (error.docLinks || []).join('\n');
    return error;
  });
  let ifEmpty = colors.grey(
    'No structural errors found during validation routine.'
  );
  utils.printData(
    newErrors,
    [['Property', 'property'], ['Message', 'message'], ['Links', 'docLinks']],
    ifEmpty,
    true
  );

  if (newErrors.length) {
    context.line(
      'Your app is structurally invalid. Address concerns and run this command again.'
    );
    process.exitCode = 1;
  } else {
    context.line('This project is structurally sound!');
  }

  let styleResult = [];
  // if either of these are true, we don't want to check style
  if (global.argOpts['without-style'] || process.exitCode === 1) {
    if (process.exitCode === 1) {
      // There were schema errors with the app, meaning Zapier may not be able to parse it
      context.line(
        colors.grey('\nSkipping app style check because app did not validate.')
      );
    }
    return;
  } else {
    context.line('\nChecking app style.');
    const rawDefinition = await utils.localAppCommand({
      command: 'definition'
    });

    styleResult = await utils.callAPI('/style-check', {
      skipDeployKey: true,
      method: 'POST',
      body: rawDefinition
    });
  }

  // process errors
  let styleErrors = condenseIssues(styleResult);
  ifEmpty = colors.grey('No style errors found during validation routine.');

  utils.printData(
    styleErrors,
    [
      ['Category', 'category'],
      ['Method', 'method'],
      ['Description', 'description'],
      ['Link', 'link']
    ],
    ifEmpty,
    true
  );

  // exit code 1 only for errors and not warnings
  if (styleErrors.filter(error => error.category === 'errors').length) {
    process.exitCode = 1;
    context.line(
      'Errors will prevent promotions, warnings are things to improve on.\n'
    );
  } else {
    context.line('Your app looks great!\n');
  }
};

validate.argsSpec = [];
validate.argOptsSpec = {
  'without-style': {
    flag: true,
    help: 'forgo pinging the Zapier server to do a style check'
  }
};
validate.help = 'Validates the current app.';
validate.example = 'zapier validate';
validate.docs = `
Runs the standard validation routine powered by json-schema that checks your app for any structural errors. This is the same routine that runs during \`zapier build\`, \`zapier upload\`, \`zapier push\` or even as a test in \`zapier test\`.

**Arguments**

${utils.argsFragment(validate.argsSpec)}
${utils.argOptsFragment(validate.argOptsSpec)}
${utils.defaultArgOptsFragment()}

${'```'}bash
$ zapier validate
# Validating project locally.
#
# No errors found during validation routine.
#
# This project is structurally sound!

$ zapier validate
# Validating project locally.
#
# ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
# │ = 1 =                                                                                                      │
# │     Property │ instance                                                                                    │
# │     Message  │ requires property "platformVersion"                                                         │
# │     Links    │ https://github.com/zapier/zapier-platform-schema/blob/v1.0.0/docs/build/schema.md#appschema │
# └──────────────┴─────────────────────────────────────────────────────────────────────────────────────────────┘
#
# Make any changes to your project and rerun this command.
${'```'}
`;

module.exports = validate;
