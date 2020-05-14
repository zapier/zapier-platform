const path = require('path');
const colors = require('colors/safe');
const _ = require('lodash');

const { ensureDir, fileExistsSync, readFile, writeFile } = require('./files');
const { splitFileFromPath } = require('./string');
const { createRootRequire, addKeyToPropertyOnApp } = require('./ast');
const { snakeCase } = require('./misc');

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
    : [variablePrefixes[action], noun];

const createTemplateContext = (action, noun, includeComments) => {
  // if noun is "Cool Contact"
  return {
    ACTION: action, // trigger
    ACTION_PLURAL: plural(action), // triggers

    VARIABLE: _.camelCase(getVariableName(action, noun)), // getContact, the variable that's imported
    KEY: snakeCase(noun), // "cool_contact", the action key
    NOUN: noun
      .split(' ')
      .map((s) => _.capitalize(s))
      .join(' '), // "Cool Contact", the noun
    LOWER_NOUN: noun.toLowerCase(), // "cool contact", for use in comments
    // resources need an extra line for tests to "just run"
    MAYBE_RESOURCE: action === 'resource' ? 'list.' : '',
    INCLUDE_INTRO_COMMENTS: includeComments,
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

module.exports = {
  createTemplateContext,
  getRelativeRequirePath,
  plural,
  updateEntryFile,
  isValidEntryFileUpdate,
  writeTemplateFile,
};
