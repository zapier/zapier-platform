'use strict';

/* Each check below is expected to return a list of ValidationSchema errors. An error is defined by:
 *   new jsonschema.ValidationError(
 *     message, // string that explains the problem, like 'must not have a URL that points to AWS'
 *     instance, // the snippet of the app defintion that is invalid
 *     schema, // name of the schema that failed, like '/TriggerSchema'
 *     propertyPath, // stringified path to problematic snippet, like 'instance.triggers.find_contact'
 *     name, // optional, the validation type that failed. Can make something up like 'invalidUrl'
 *     argument // optional
 *   );
*/
const checks = [
  require('./searchOrCreateKeys'),
  require('./deepNestedFields'),
  require('./mutuallyExclusiveFields'),
  require('./requiredSamples'),
  require('./matchingKeys')
];

const runFunctionalConstraints = (definition, mainSchema) => {
  return checks.reduce((errors, checkFunc) => {
    const errorsForCheck = checkFunc(definition, mainSchema);
    if (errorsForCheck) {
      errors = errors.concat(errorsForCheck);
    }
    return errors;
  }, []);
};

module.exports = {
  run: runFunctionalConstraints
};
