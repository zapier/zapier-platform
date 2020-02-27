const path = require('path');
const colors = require('colors/safe');
const _ = require('lodash');

const { ensureDir, fileExistsSync, readFile, writeFile } = require('./files');
const { splitFileFromPath } = require('../utils/string');
const { createRootRequire, addKeyToPropertyOnApp } = require('./ast');
const { snakeCase } = require('./misc');

const plural = type => (type === 'search' ? `${type}es` : `${type}s`);

const getTemplatePath = actionType =>
  path.join(__dirname, '../..', `scaffold/${actionType}.template.js`);

const createTemplateContext = (action, noun, includeComments) => {
  // if noun is "Cool Contact"
  return {
    ACTION: action, // trigger
    ACTION_PLURAL: plural(action), // triggers

    KEY: snakeCase(noun), // "cool_contact", the action key
    NOUN: _.capitalize(noun), // "Cool contact", the noun
    LOWER_NOUN: noun.toLowerCase(), // "cool contact", for use in comments
    // resources need an extra line for tests to "just run"
    MAYBE_RESOURCE: action === 'resource' ? 'list.' : '',
    INCLUDE_INTRO_COMMENTS: includeComments
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
        )} to overwrite the current ${filename}`
      ].join('\n')
    );
  }

  const template = (await readFile(templatePath)).toString();
  const renderTemplate = _.template(template);

  await ensureDir(path.dirname(destinationPath));
  await writeFile(destinationPath, renderTemplate(templateContext));
};

const updateEntryFile = async (
  entryFilePath,
  varName,
  newFilePath,
  actionType,
  newActionKey
) => {
  let codeStr = (await readFile(entryFilePath)).toString();
  // const originalCodeStr = codeStr; // untouched copy in case we need to bail
  const entryName = splitFileFromPath(entryFilePath)[1];
  const relativePath = path.relative(path.dirname(entryFilePath), newFilePath);

  try {
    codeStr = createRootRequire(codeStr, varName, `./${relativePath}`);
    codeStr = addKeyToPropertyOnApp(codeStr, plural(actionType), varName);
    await writeFile(entryFilePath, codeStr);

    // validate the edit happened correctly
    // can't think of why it wouldn't, but it doesn't hurt to double check
    // ensure a clean access
    delete require.cache[require.resolve(entryFilePath)];
    const rewrittenIndex = require(entryFilePath);
    if (!_.get(rewrittenIndex, [plural(actionType), newActionKey])) {
      throw new Error();
    }
  } catch (e) {
    if (e.message) {
      throw e;
    }
    // if we get here, just throw something generic
    throw new Error(
      [
        `\n${colors.bold(
          `Oops, we could not reliably rewrite your ${entryName}.`
        )} Please ensure the following lines exist:`,
        ` * \`const ${varName} = require('./${newFilePath}');\` at the top-level`,
        ` * \`[${varName}.key]: ${varName}\` in the "${plural(
          actionType
        )}" object in your exported integration definition`
      ].join('\n')
    );
  }
};

module.exports = {
  plural,
  updateEntryFile,
  writeTemplateFile,
  createTemplateContext
};
