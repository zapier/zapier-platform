// tools for modifiyng an AST

const j = require('jscodeshift');

// simple helper functions used for searching for nodes
// can't use j.identifier(name) because it has extra properties and we have to have no extras to find nodes
// we can use them when creating nodes though!
const typeHelpers = {
  identifier: name => ({ type: 'Identifier', name }),
  callExpression: name => ({
    type: 'CallExpression',
    callee: { name }
  }),
  memberExpression: (object, property) => ({
    type: 'MemberExpression',
    object,
    property
  })
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
      declarations: [{ init: typeHelpers.callExpression('require') }]
    })
    // filters for top-level require statements by filtering only for statements whose parents are type Program, the root
    .filter(path => j.Program.check(path.parent.value));

  const newRequireStatement = j.variableDeclaration('const', [
    j.variableDeclarator(
      j.identifier(varName),
      j.callExpression(j.identifier('require'), [j.literal(path)])
    )
  ]);

  if (reqStatements.length) {
    reqStatements.at(-1).insertAfter(newRequireStatement);
  } else {
    // insert at top of program
    const body = root.find(j.Program).get().node.body;

    body.unshift(newRequireStatement);

    body[0].comments = body[1].comments;
    delete body[1].comments;
  }
  return root.toSource();
};

const addKeyToPropertyOnApp = (codeStr, property, varName) => {
  // to play with this, use https://astexplorer.net/#/gist/cb4986b3f1c6eb975339608109a48e7d/0fbf2fabbcf27d0b6ebd8910f979bd5d97dd9404

  const root = j(codeStr);
  // what we'll hopefully insert
  const newKeyProperty = j.property.from({
    kind: 'init',
    key: j.memberExpression(j.identifier(varName), j.identifier('key')),
    value: j.identifier(varName),
    computed: true
  });

  // const subProp = root.find(j.Property, {
  //   key: typeHelpers.identifier(property)
  // });

  // if (subProp.length) {
  //   // this is the easiest case, where we find whatever object has a "triggers" property
  //   // there's a slight wrinkle that converted legacy apps have a `legacy.triggers` property, so we have to make sure the parent isn't legacy

  //   if (subProp.length > 1) {
  //     // legacy app
  //     // filter for parent property not being legacy
  //     subProp == 3;
  //   }

  //   const value = subProp.get().node.value;
  //   if (value.type !== 'ObjectExpression') {
  //     throw new Error(
  //       `Tried to edit the ${property} key, but the value wasn't an object`
  //     );
  //   }
  //   subProp.get().node.value.properties.push(
  //     // creates a new property on that sub property
  //     // TODO: detect duplicates?
  //     newKeyProperty
  //   );
  // } else {
  // if nothing has "triggers", then we need to find whatever is being exported
  // that's either a variable or a plain object
  const exportAssignment = root.find(j.AssignmentExpression, {
    left: typeHelpers.memberExpression(
      typeHelpers.identifier('module'),
      typeHelpers.identifier('exports')
    )
  });

  if (!exportAssignment.length) {
    throw new Error(
      'Nothing is exported from this file; unable to find an object modify'
    );
  }

  // there's either an object or a variable exported
  const exported = exportAssignment.get().node.right;

  if (exported.type === 'ObjectExpression') {
    // we know this doesn't have a "triggers" property or we would have found it earlier. add away!
    // TODO: no longer true ^ !!

    // NOTE

    // when there are 2 `triggers:`, the grandparent of one is the declaration we found before
    // if it's a variable, anyway. if it's an object, it's probably the module.exports call
    // l.isEqual(variableDeclaration.get().node.declarations[0], existingProp.paths()[1].parent.parent.node)

    exported.properties.push(
      j.property(
        'init',
        j.identifier(property),
        j.objectExpression([newKeyProperty])
      )
    );
  } else if (exported.type === 'Identifier') {
    // variable, need to find that
    const variableDeclaration = root.find(j.VariableDeclaration, {
      declarations: [{ id: typeHelpers.identifier(exported.name) }]
    });
    if (
      !variableDeclaration.length ||
      // if the variable is just a different variable, we can't modify safely
      variableDeclaration.get().node.declarations[0].init.type !==
        'ObjectExpression'
    ) {
      throw new Error('Unable to find definition for exported variable');
    }
    // check if this variable already has the property
    const existingProp = variableDeclaration.find(j.Property, {
      key: typeHelpers.identifier(property)
    });
    if (existingProp.length) {
      const value = existingProp.get().node.value;
      if (value.type !== 'ObjectExpression') {
        throw new Error(
          `Tried to edit the ${property} key, but the value wasn't an object`
        );
      }
      existingProp.get().node.value.properties.push(
        // creates a new property on that sub property
        // TODO: detect duplicates?
        newKeyProperty
      );
    } else {
      variableDeclaration
        .get()
        .node.declarations[0].init.properties.push(
          j.property(
            'init',
            j.identifier(property),
            j.objectExpression([newKeyProperty])
          )
        );
    }
  } else {
    throw new Error('Unknown export type');
  }
  // }
  return root.toSource();
};

module.exports = { createRootRequire, addKeyToPropertyOnApp };
