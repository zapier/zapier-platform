// @ts-check

const path = require('path');
const colors = require('colors/safe');
const _ = require('lodash');

const { ensureDir, fileExistsSync, readFile, writeFile } = require('./files');
const { splitFileFromPath } = require('./string');
const {
  importActionInJsApp,
  registerActionInJsApp,
  importActionInTsApp,
  registerActionInTsApp,
} = require('./ast');

const plural = (type) => (type === 'search' ? `${type}es` : `${type}s`);

/**
 * @param {TemplateType} templateType
 * @param {'js' | 'ts'} language
 * @returns {string}
 */
const getTemplatePath = (templateType, language = 'js') =>
  path.join(
    __dirname,
    '..',
    '..',
    'scaffold',
    `${templateType}.template.${language}`,
  );

// useful for making sure we don't conflict with other, similarly named things
const variablePrefixes = {
  trigger: 'get',
  search: 'find',
  create: 'create',
};

const getVariableName = (action, noun) =>
  action === 'resource'
    ? [noun, 'resource'].join(' ')
    : [variablePrefixes[action], noun].join(' ');

/**
 * Produce a valid snake_case key from one or more nouns, and fix the
 * inconsistent version numbers that come from _.snakeCase.
 *
 * @example
 * nounToKey('Cool Contact V10') // cool_contact_v10
 */
const nounToKey = (noun) => _.snakeCase(noun).replace(/V_(\d+)$/gi, 'v$1');

/**
 * Create a context object to pass to the template
 * @param {Object} options
 * @param {ActionType} options.actionType - the action type
 * @param {string} options.noun - the noun for the action
 * @param {boolean} [options.includeIntroComments] - whether to include comments in the template
 * @returns {TemplateContext}
 */
const createTemplateContext = ({
  actionType,
  noun,
  includeIntroComments = false,
}) => {
  // if noun is "Cool Contact"
  return {
    ACTION: actionType, // trigger
    ACTION_PLURAL: plural(actionType), // triggers

    VARIABLE: _.camelCase(getVariableName(actionType, noun)), // getContact, the variable that's imported
    KEY: nounToKey(noun), // "cool_contact", the action key
    NOUN: noun
      .split(' ')
      .map((s) => _.capitalize(s))
      .join(' '), // "Cool Contact", the noun
    LOWER_NOUN: noun.toLowerCase(), // "cool contact", for use in comments
    // resources need an extra line for tests to "just run"
    MAYBE_RESOURCE: actionType === 'resource' ? 'list.' : '',
    INCLUDE_INTRO_COMMENTS: includeIntroComments,
  };
};

/**
 * @param {Object} options
 * @param {TemplateType} options.templateType - the template to write
 * @param {'js' | 'ts'} options.language - the language of the project
 * @param {string} options.destinationPath - where to write the file
 * @param {boolean} options.preventOverwrite - whether to prevent overwriting
 * @param {TemplateContext} options.templateContext - the context for the template
 */
const writeTemplateFile = async ({
  templateType,
  language,
  destinationPath,
  preventOverwrite,
  templateContext,
}) => {
  const templatePath = getTemplatePath(templateType, language);

  if (preventOverwrite && fileExistsSync(destinationPath)) {
    const [location, filename] = splitFileFromPath(destinationPath);

    throw new Error(
      [
        `File ${colors.bold(filename)} already exists within ${colors.bold(
          location,
        )}.`,
        'You can either:',
        '  1. Choose a different filename',
        `  2. Delete ${filename} from ${location}`,
        `  3. Run ${colors.italic('scaffold')} with ${colors.bold(
          '--force',
        )} to overwrite the current ${filename}`,
      ].join('\n'),
    );
  }

  const template = (await readFile(templatePath)).toString();
  const renderTemplate = _.template(template);

  await ensureDir(path.dirname(destinationPath));
  await writeFile(destinationPath, renderTemplate(templateContext));
};

const getRelativeRequirePath = (entryFilePath, newFilePath) =>
  path.relative(path.dirname(entryFilePath), newFilePath);

const isValidEntryFileUpdate = (
  language,
  indexFileResolved,
  actionType,
  newActionKey,
) => {
  if (language === 'js') {
    // ensure a clean access
    delete require.cache[require.resolve(indexFileResolved)];
    // this line fails if `npm install` hasn't been run, since core isn't present yet.
    const rewrittenIndex = require(indexFileResolved);
    return Boolean(_.get(rewrittenIndex, [plural(actionType), newActionKey]));
  }
  return true;
};

/**
 * Modify an index.js/index.ts file to import and reference the newly
 * scaffolded action.
 *
 * @param {Object} options
 * @param {'ts'|'js'} options.language - the language of the project
 * @param {string} options.indexFileResolved - the App's entry point (index.js/ts)
 * @param {string} options.actionRelativeImportPath - The path to import the new action with
 * @param {string} options.actionImportName - the name of the import, i.e the action key converted to camel_case
 * @param {ActionType} options.actionType - The type of action, e.g. 'trigger'
 */
const updateEntryFile = async ({
  language,
  indexFileResolved,
  actionRelativeImportPath,
  actionImportName,
  actionType,
}) => {
  if (language === 'ts') {
    return updateEntryFileTs({
      indexFileResolved,
      actionRelativeImportPath,
      actionImportName,
      actionType,
    });
  }
  return updateEntryFileJs({
    indexFileResolved,
    actionRelativeImportPath,
    actionImportName,
    actionType,
  });
};

/**
 *
 * @param {Object} options
 * @param {string} options.indexFileResolved - the App's entry point (index.js/ts)
 * @param {string} options.actionRelativeImportPath - The path to import the new action with
 * @param {string} options.actionImportName - the name of the import, i.e the action key converted to camel_case
 * @param {ActionType} options.actionType - The type of action, e.g. 'trigger'
 */
const updateEntryFileJs = async ({
  indexFileResolved,
  actionRelativeImportPath,
  actionImportName,
  actionType,
}) => {
  let codeStr = (await readFile(indexFileResolved)).toString();
  const originalCodeStr = codeStr; // untouched copy in case we need to bail

  codeStr = importActionInJsApp(
    codeStr,
    actionImportName,
    actionRelativeImportPath,
  );
  codeStr = registerActionInJsApp(
    codeStr,
    plural(actionType),
    actionImportName,
  );
  await writeFile(indexFileResolved, codeStr);
  return originalCodeStr;
};

/**
 *
 * @param {Object} options
 * @param {string} options.indexFileResolved - The App's entry point (index.js/ts)
 * @param {string} options.actionRelativeImportPath - The path to import the new action with (relative to the index)
 * @param {string} options.actionImportName - The name of the import, i.e the action key converted to camel_case
 * @param {ActionType} options.actionType - The type of action, e.g. 'trigger'
 */
const updateEntryFileTs = async ({
  indexFileResolved,
  actionRelativeImportPath,
  actionImportName,
  actionType,
}) => {
  let codeStr = (await readFile(indexFileResolved)).toString();
  const originalCodeStr = codeStr; // untouched copy in case we need to bail

  codeStr = importActionInTsApp(
    codeStr,
    actionImportName,
    actionRelativeImportPath,
  );
  codeStr = registerActionInTsApp(
    codeStr,
    plural(actionType),
    actionImportName,
  );
  await writeFile(indexFileResolved, codeStr);
  return originalCodeStr;
};

/**
 *
 * Prepare everything needed to define what's happening in a scaffolding
 * operation.
 *
 * @param {Object} options
 * @param {ActionType} options.actionType - the action type
 * @param {string} options.noun - the noun for the action
 * @param {'js' | 'ts'} options.language - the language of the project
 * @param {string} options.indexFileLocal - the App's entry point (index.js/ts)
 * @param {string} options.actionDirLocal - where to put the new action
 * @param {string} options.testDirLocal - where to put the new action's test
 * @param {boolean} options.includeIntroComments - whether to include comments in the template
 * @param {boolean} options.preventOverwrite - whether to force overwrite
 *
 * @returns {ScaffoldContext}
 */
const createScaffoldingContext = ({
  actionType,
  noun,
  language,
  indexFileLocal,
  actionDirLocal,
  testDirLocal,
  includeIntroComments,
  preventOverwrite,
}) => {
  const key = nounToKey(noun);
  const cwd = process.cwd();
  const indexFileResolved = path.join(cwd, indexFileLocal);
  const actionFileResolved = `${path.join(
    cwd,
    actionDirLocal,
    key,
  )}.${language}`;
  const actionFileResolvedStem = path.join(cwd, actionDirLocal, key);
  const actionFileLocal = `${path.join(actionDirLocal, key)}.${language}`;
  const actionFileLocalStem = path.join(actionDirLocal, key);
  const testFileResolved = `${path.join(
    cwd,
    testDirLocal,
    key,
  )}.test.${language}`;
  const testFileLocal = `${path.join(testDirLocal, key)}.${language}`;
  const testFileLocalStem = path.join(testDirLocal, key);

  // Generate the relative import path
  let actionRelativeImportPath = `./${getRelativeRequirePath(
    indexFileResolved,
    actionFileResolvedStem,
  )}`;

  // For TypeScript with ESM, imports must use .js extension
  if (language === 'ts') {
    actionRelativeImportPath += '.js';
  }

  return {
    actionType,
    actionTypePlural: plural(actionType),
    noun,
    preventOverwrite,
    language,
    templateContext: createTemplateContext({
      actionType,
      noun,
      includeIntroComments,
    }),

    indexFileLocal,
    indexFileResolved,
    actionRelativeImportPath,

    actionFileResolved,
    actionFileResolvedStem,
    actionFileLocal,
    actionFileLocalStem,

    testFileResolved,
    testFileLocal,
    testFileLocalStem,
  };
};

module.exports = {
  createScaffoldingContext,
  createTemplateContext,
  getRelativeRequirePath,
  plural,
  nounToKey,
  updateEntryFile,
  isValidEntryFileUpdate,
  writeTemplateFile,
};

/**
 * The varieties of actions that can be generated.
 * @typedef {'create' | 'resource' | 'search' | 'trigger'} ActionType
 */
/**
 * The types of templates that can be made, including "test" files.
 * @typedef { ActionType | 'test' } TemplateType
 */

/**
 * @typedef {Object} TemplateContext
 * @property {string} ACTION - the action type
 * @property {string} ACTION_PLURAL - the plural of the action type
 * @property {string} VARIABLE - the variable that's imported
 * @property {string} KEY - the action key
 * @property {string} NOUN - the noun
 * @property {string} LOWER_NOUN - the noun in lowercase
 * @property {string} MAYBE_RESOURCE - an extra line for resources
 * @property {boolean} INCLUDE_INTRO_COMMENTS - whether to include comments
 */

/**
 * Everything needed to define a scaffolding operation.
 *
 * @typedef {Object} ScaffoldContext
 * @property {ActionType} actionType - the type of action being created
 * @property {string} actionTypePlural - plural of the template type, e.g. "triggers".
 * @property {string} noun - the noun for the action
 * @property {'js' | 'ts'} language - the language of the project
 * @property {boolean} preventOverwrite - whether to prevent overwriting
 * @property {TemplateContext} templateContext - the context for templates
 *
 * @property {string} indexFileLocal - e.g. `index.js` or `src/index.ts`
 * @property {string} indexFileResolved - e.g. `/Users/sal/my-app/index.js`
 *
 * @property {string} actionFileResolved - e.g. `/Users/sal/my-app/triggers/foobar.js`
 * @property {string} actionFileResolvedStem - e.g. `/Users/sal/my-app/triggers/foobar`
 * @property {string} actionFileLocal - e.g. `triggers/foobar.js`
 * @property {string} actionFileLocalStem - e.g. `triggers/foobar`
 * @property {string} actionRelativeImportPath - e.g. `triggers/foobar`
 *
 * @property {string} testFileResolved - e.g. `/Users/sal/my-app/test/triggers/foobar.test.js`
 * @property {string} testFileLocal - e.g. `test/triggers/foobar.js`
 * @property {string} testFileLocalStem - e.g. `test/triggers/foobar`
 */
