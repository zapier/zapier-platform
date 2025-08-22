// @ts-check

// tools for modifying an AST

const j = require('jscodeshift');
const ts = j.withParser('ts');

// simple helper functions used for searching for nodes
// can't use j.identifier(name) because it has extra properties and we have to have no extras to find nodes
// we can use them when creating nodes though!
const typeHelpers = {
  identifier: (name) => ({ type: 'Identifier', name }),
  callExpression: (name) => ({
    type: 'CallExpression',
    callee: { name },
  }),
  memberExpression: (object, property) => ({
    type: 'MemberExpression',
    object,
    property,
  }),
};

/**
 * adds a `const verName = require(path)` to the root of a codeStr
 */
const importActionInJsApp = (codeStr, varName, path) => {
  if (codeStr.match(new RegExp(`${varName} ?= ?require`))) {
    // duplicate identifier, no need to re-add
    // this would fail if they used this variable name for something else; we'd keep going and double-declare that variable
    // TODO: throw error if it's a duplicate identifier but different require path?
    return codeStr;
  }
  const root = j(codeStr);
  // insert a new require statement after all other requires (that get put into variables, like might happen at the top-level)
  const reqStatements = root
    // searching for VariableDeclaration, like `const x = require('y')`
    // skips over `require` statements not saved to variables, since that's (probably) not a common case
    .find(j.VariableDeclaration, {
      declarations: [{ init: typeHelpers.callExpression('require') }],
    })
    // filters for top-level require statements by filtering only for statements whose parents are type Program, the root
    .filter((path) => j.Program.check(path.parent.value));

  const newRequireStatement = j.variableDeclaration('const', [
    j.variableDeclarator(
      j.identifier(varName),
      j.callExpression(j.identifier('require'), [j.literal(path)]),
    ),
  ]);

  if (reqStatements.length) {
    reqStatements.at(-1).insertAfter(newRequireStatement);
  } else {
    // insert at top of program
    const body = root.find(j.Program).get().node.body;

    body.unshift(newRequireStatement);

    // retain leading comments
    body[0].comments = body[1].comments;
    delete body[1].comments;
  }
  return root.toSource();
};

const registerActionInJsApp = (codeStr, property, varName) => {
  // to play with this, use https://astexplorer.net/#/gist/cb4986b3f1c6eb975339608109a48e7d/0fbf2fabbcf27d0b6ebd8910f979bd5d97dd9404

  const root = j(codeStr);
  // what we'll hopefully insert
  const newProperty = j.property.from({
    kind: 'init',
    key: j.memberExpression(j.identifier(varName), j.identifier('key')),
    value: j.identifier(varName),
    computed: true,
  });

  // we start by looking for what's on the right side of a `module.exports` call
  const exportAssignment = root.find(j.AssignmentExpression, {
    left: typeHelpers.memberExpression(
      typeHelpers.identifier('module'),
      typeHelpers.identifier('exports'),
    ),
  });

  if (!exportAssignment.length) {
    throw new Error(
      'Nothing is exported from this file; unable to find an object to modify',
    );
  }

  let objToModify = exportAssignment.get().node.right;

  if (objToModify.type === 'Identifier') {
    // variable, need to find that
    const exportedVarDeclaration = root.find(j.VariableDeclaration, {
      declarations: [{ id: typeHelpers.identifier(objToModify.name) }],
    });
    if (
      !exportedVarDeclaration.length ||
      // if the variable is just a different variable, we can't modify safely
      exportedVarDeclaration.get().node.declarations[0].init.type !==
        'ObjectExpression'
    ) {
      throw new Error('Unable to find object definition for exported variable');
    }
    objToModify = exportedVarDeclaration.get().node.declarations[0].init;
  } else if (objToModify.type !== 'ObjectExpression') {
    // If the exported value isn't an object or variable
    throw new Error(`Invalid export type: "${objToModify.type}"`);
  }

  // now we have an object to modify

  // check if this object already has the property at the top level
  const existingProp = objToModify.properties.find(
    (props) => props.key && props.key.name === property,
  );
  if (existingProp) {
    // `triggers: myTriggers` means we shouldn't bother
    const value = existingProp.value;
    if (value.type !== 'ObjectExpression') {
      throw new Error(
        `Tried to edit the ${property} key, but the value wasn't an object`,
      );
    }
    value.properties.push(newProperty);
  } else {
    objToModify.properties.push(
      j.property(
        'init',
        j.identifier(property),
        j.objectExpression([newProperty]),
      ),
    );
  }

  return root.toSource();
};

/**
 * Adds an import statement to the top of an index.ts file to import a
 * new action, such as `import some_trigger from './triggers/some_trigger';`
 *
 * @param {string} codeStr - The code of the index.ts file to modify.
 * @param {string} identifierName - The name of imported action used as a variable in the code.
 * @param {string} actionRelativeImportPath - The relative path to import the action from
 * @returns {string}
 */
const importActionInTsApp = (
  codeStr,
  identifierName,
  actionRelativeImportPath,
) => {
  const root = ts(codeStr);

  const imports = root.find(ts.ImportDeclaration);

  const newImportStatement = j.importDeclaration(
    [j.importDefaultSpecifier(j.identifier(identifierName))],
    j.literal(actionRelativeImportPath),
  );

  if (imports.length) {
    imports.at(-1).insertAfter(newImportStatement);
  } else {
    const body = root.find(ts.Program).get().node.body;
    body.unshift(newImportStatement);
    // Add newline after import?
  }

  return root.toSource({ quote: 'single' });
};

/**
 *
 * @param {string} codeStr
 * @param {'creates' | 'searches' | 'triggers'} actionTypePlural - The type of action to register within the app
 * @param {string} identifierName - Name of the action imported to be registered
 * @returns {string}
 */
const registerActionInTsApp = (codeStr, actionTypePlural, identifierName) => {
  const root = ts(codeStr);

  // the `[thing.key]: thing` entry we'd like to insert.
  const newProperty = ts.property.from({
    kind: 'init',
    key: j.memberExpression(j.identifier(identifierName), j.identifier('key')),
    value: j.identifier(identifierName),
    computed: true,
  });

  // Find the top level app Object; the one with the `platformVersion`
  // key. This is where we'll insert our new property.
  const appObjectCandidates = root
    .find(ts.ObjectExpression)
    .filter((path) =>
      path.value.properties.some(
        (prop) => prop.key && prop.key.name === 'platformVersion',
      ),
    );
  if (appObjectCandidates.length !== 1) {
    throw new Error('Unable to find the app definition to modify');
  }
  const appObj = appObjectCandidates.get().node;

  // Now we have an app object to modify.

  // Check if this object already has the actionType group inside it.
  const existingProp = appObj.properties.find(
    (props) => props.key && props.key.name === actionTypePlural,
  );
  if (existingProp) {
    const value = existingProp.value;
    if (value.type !== 'ObjectExpression') {
      throw new Error(
        `Tried to edit the ${actionTypePlural} key, but the value wasn't an object`,
      );
    }
    value.properties.push(newProperty);
  } else {
    appObj.properties.push(
      j.property(
        'init',
        j.identifier(actionTypePlural),
        j.objectExpression([newProperty]),
      ),
    );
  }

  return root.toSource({ quote: 'single' });
};

module.exports = {
  importActionInJsApp,
  registerActionInJsApp,
  importActionInTsApp,
  registerActionInTsApp,
};
