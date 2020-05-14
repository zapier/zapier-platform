// tools for modifiyng an AST

const j = require('jscodeshift');

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
const createRootRequire = (codeStr, varName, path) => {
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
      j.callExpression(j.identifier('require'), [j.literal(path)])
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

const addKeyToPropertyOnApp = (codeStr, property, varName) => {
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
      typeHelpers.identifier('exports')
    ),
  });

  if (!exportAssignment.length) {
    throw new Error(
      'Nothing is exported from this file; unable to find an object to modify'
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
    (props) => props.key.name === property
  );
  if (existingProp) {
    // `triggers: myTriggers` means we shouldn't bother
    const value = existingProp.value;
    if (value.type !== 'ObjectExpression') {
      throw new Error(
        `Tried to edit the ${property} key, but the value wasn't an object`
      );
    }
    value.properties.push(newProperty);
  } else {
    objToModify.properties.push(
      j.property(
        'init',
        j.identifier(property),
        j.objectExpression([newProperty])
      )
    );
  }

  return root.toSource();
};

module.exports = { createRootRequire, addKeyToPropertyOnApp };
