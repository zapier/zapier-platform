// @ts-check

const path = require('path');
const colors = require('colors/safe');
const _ = require('lodash');

const { ensureDir, fileExistsSync, readFile, writeFile } = require('./files');
const { splitFileFromPath } = require('./string');
const { createRootRequire, addKeyToPropertyOnApp } = require('./ast');

const plural = (type) => (type === 'search' ? `${type}es` : `${type}s`);

const getTemplatePath = (actionType) =>
  path.join(__dirname, '..', '..', 'scaffold', `${actionType}.template.js`);

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
 * @param {'trigger'| 'search'| 'create'| 'resource'} options.actionType - the action type
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

const writeTemplateFile = async (
  actionType,
  templateContext,
  destinationPath,
  preventOverwrite
) => {
  const templatePath = getTemplatePath(actionType);

  if (preventOverwrite && fileExistsSync(destinationPath)) {
    const [location, filename] = splitFileFromPath(destinationPath);

    throw new Error(
      [
        `File ${colors.bold(filename)} already exists within ${colors.bold(
          location
        )}.`,
        'You can either:',
        '  1. Choose a different filename',
        `  2. Delete ${filename} from ${location}`,
        `  3. Run ${colors.italic('scaffold')} with ${colors.bold(
          '--force'
        )} to overwrite the current ${filename}`,
      ].join('\n')
    );
  }

  const template = (await readFile(templatePath)).toString();
  const renderTemplate = _.template(template);

  await ensureDir(path.dirname(destinationPath));
  await writeFile(destinationPath, renderTemplate(templateContext));
};

const getRelativeRequirePath = (entryFilePath, newFilePath) =>
  path.relative(path.dirname(entryFilePath), newFilePath);

/**
 * performs a series of updates to a file at a path.
 *
 * returns the original file contents in case a revert is needed
 */
const updateEntryFile = async (
  entryFilePath,
  varName,
  newFilePath,
  actionType,
  newActionKey
) => {
  let codeStr = (await readFile(entryFilePath)).toString();
  const originalCodeStr = codeStr; // untouched copy in case we need to bail
  const relativePath = getRelativeRequirePath(entryFilePath, newFilePath);

  codeStr = createRootRequire(codeStr, varName, `./${relativePath}`);
  codeStr = addKeyToPropertyOnApp(codeStr, plural(actionType), varName);
  await writeFile(entryFilePath, codeStr);
  return originalCodeStr;
};

const isValidEntryFileUpdate = (entryFilePath, actionType, newActionKey) => {
  // ensure a clean access
  delete require.cache[require.resolve(entryFilePath)];

  // this line fails if `npm install` hasn't been run, since core isn't present yet.
  const rewrittenIndex = require(entryFilePath);
  return Boolean(_.get(rewrittenIndex, [plural(actionType), newActionKey]));
};

/**
 *
 * Prepare everything needed to define what's happening in a scaffolding
 * operation.
 *
 * @param {Object} options
 * @param {'trigger'| 'search'| 'create'| 'resource'} options.actionType - the action type
 * @param {string} options.noun - the noun for the action
 * @param {string} options.indexFile - the App's entry point (index.js/ts)
 * @param {string} options.actionDir - where to put the new action
 * @param {string} options.testDir - where to put the new action's test
 * @param {boolean} options.includeIntroComments - whether to include comments in the template
 * @param {boolean} options.force - whether to force overwrite
 *
 * @returns {ScaffoldContext}
 */
const createScaffoldingContext = ({
  actionType,
  noun,
  indexFile,
  actionDir,
  testDir,
  includeIntroComments,
  force,
}) => {
  const key = nounToKey(noun);
  const isTypeScript = indexFile.endsWith('.ts');

  const indexFileResolved = path.join(process.cwd(), indexFile);
  const actionFileResolved = `${path.join(process.cwd(), actionDir, key)}.js`;
  const actionFileResolvedStem = path.join(process.cwd(), actionDir, key);
  const actionFileLocal = `${path.join(actionDir, key)}.js`;
  const actionFileLocalStem = path.join(actionDir, key);
  const testFileResolved = `${path.join(process.cwd(), testDir, key)}.test.js`;
  const testFileLocal = `${path.join(testDir, key)}.js`;
  const testFileLocalStem = path.join(testDir, key);
  const indexFileRelativeImportPath = getRelativeRequirePath(
    indexFileResolved,
    actionFileResolvedStem
  );

  return {
    actionType,
    actionTypePlural: plural(actionType),
    noun,
    force,
    isTypeScript,
    templateContext: createTemplateContext({
      actionType,
      noun,
      includeIntroComments,
    }),

    indexFileLocal: indexFile,
    indexFileResolved,
    indexFileRelativeImportPath,

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
 * @property {string} actionType - the action type
 * @property {string} actionTypePlural - plural of the action type, e.g. "triggers".
 * @property {string} noun - the noun for the action
 * @property {boolean} isTypeScript - whether the project is TypeScript
 * @property {boolean} force - whether to force overwrite
 * @property {TemplateContext} templateContext - the context for templates
 *
 * @property {string} indexFileLocal - e.g. `index.js` or `src/index.ts`
 * @property {string} indexFileResolved - e.g. `/Users/sal/my-app/index.js`
 * @property {string} indexFileRelativeImportPath - e.g. `triggers/foobar`
 *
 * @property {string} actionFileResolved - e.g. `/Users/sal/my-app/triggers/foobar.js`
 * @property {string} actionFileResolvedStem - e.g. `/Users/sal/my-app/triggers/foobar`
 * @property {string} actionFileLocal - e.g. `triggers/foobar.js`
 * @property {string} actionFileLocalStem - e.g. `triggers/foobar`
 *
 * @property {string} testFileResolved - e.g. `/Users/sal/my-app/test/triggers/foobar.test.js`
 * @property {string} testFileLocal - e.g. `test/triggers/foobar.js`
 * @property {string} testFileLocalStem - e.g. `test/triggers/foobar`
 */
