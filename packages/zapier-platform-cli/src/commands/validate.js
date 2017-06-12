const _ = require('lodash');
const colors = require('colors/safe');

const utils = require('../utils');

// shadow of engine/style_checker/_condense_issues
const condenseIssues = (styleResult) => {
  let res = [];
  const docURL = 'https://zapier.com/developer/documentation/v2/style-checks-reference';
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

const validate = (context) => {
  context.line('\nValidating project locally.');
  return Promise.resolve()
    .then(() => utils.localAppCommand({command: 'validate'}))
    .then((errors) => {
      const newErrors = errors.map((error) => {
        error = _.extend({}, error);
        error.property = error.property.replace('instance.', 'App.');
        error.docLinks = (error.docLinks || []).join('\n');
        return error;
      });
      const ifEmpty = colors.grey('No structural errors found during validation routine.');
      utils.printData(newErrors, [
        ['Property', 'property'],
        ['Message', 'message'],
        ['Links', 'docLinks'],
      ], ifEmpty, true);
      return errors;
    })
    .then((errors) => {
      if (errors.length) {
        context.line('Your app is structurally invalid. Address concerns and run this command again.');
        process.exitCode = 1;
      } else {
        context.line('This project is structurally sound!');
      }
    })
    .then(() => {
      if (!utils.isCorrectVersion(context)) {
        process.exitCode = 1;
      }
    })
    .then(() => {
      if (global.argOpts['include-style']) {
        utils.localAppCommand({ command: 'definition' })
          .then((rawDefinition) => {
            return utils.callAPI('/style-check', {
              skipDeployKey: true,
              method: 'POST',
              body: rawDefinition
            });
          })
          .then((styleResult) => {
            // process errors
            context.line('\nChecking app style.');
            let styleErrors = condenseIssues(styleResult);

            const ifEmpty = colors.grey('No style errors found during validation routine.');
            if (styleErrors.length) {
              utils.printData(styleErrors, [
                ['Category', 'category'],
                ['Method', 'method'],
                ['Description', 'description'],
                ['Link', 'link']
              ], ifEmpty, true);
              process.exitCode = 1;
              context.line('Errors will prevent promotions, warnings are things to improve on.\n');
            } else {
              context.line('Your app looks great!\n');
            }
          });
      }
    });
};
validate.argsSpec = [];
validate.argOptsSpec = {
  'include-style': { flag: true, help: 'ping the Zapier server to do a style check' },
};
validate.help = 'Validates the current app.';
validate.example = 'zapier validate';
validate.docs = `\
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
