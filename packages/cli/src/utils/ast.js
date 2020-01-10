// tools for modifiyng an AST

const j = require('jscodeshift');

const createRootRequire = (codeStr, varName, path) => {
  if (codeStr.includes(`const ${varName}`)) {
    // duplicate identifier, no need to re-add
    return codeStr;
  }
  const root = j(codeStr);
  // insert a new require statement after all other requires (that get put into variables, like might happen at the top-level)
  const reqStatements = root
    // searching for VariableDeclaration, like `const x = require('y')`
    // skips over `require` statements not saved to variables, since that's (probably) not a common case
    .find(j.VariableDeclaration, {
      declarations: [
        { init: { type: 'CallExpression', callee: { name: 'require' } } }
      ]
    })
    // filters for top-level require statements by filtering only for statements whose parents are type Program, the root
    .filter(path => j.Program.check(path.parent.value));

  if (reqStatements.length) {
    reqStatements
      .at(-1)
      .insertAfter(
        j.variableDeclaration('const', [
          j.variableDeclarator(
            j.identifier(varName),
            j.callExpression(j.identifier('require'), [j.literal(path)])
          )
        ])
      );
  } else {
    // insert at top of program
    const body = root.find(j.Program).get().node.body;

    body.unshift(
      j.variableDeclaration('const', [
        j.variableDeclarator(
          j.identifier(varName),
          j.callExpression(j.identifier('require'), [j.literal(path)])
        )
      ])
    );

    body[0].comments = body[1].comments;
    delete body[1].comments;
  }
  return root.toSource();
};

const addKeyToPropertyOnApp = (codeStr, property, varName) => {
  // to play with this, use https://astexplorer.net/#/gist/cb4986b3f1c6eb975339608109a48e7d/0fbf2fabbcf27d0b6ebd8910f979bd5d97dd9404

  // TODO: the last step will add a duplicate import, so we should fail gracefully here?s
  const root = j(codeStr);
  const subProp = root.find(j.Property, {
    key: { type: 'Identifier', name: property }
  });
  if (subProp.length) {
    // App has (for example) App.triggers
    subProp.get(0).node.value.properties.push(
      // creates a new property on that sub property
      // TODO: detect duplicates
      j.property.from({
        kind: 'init',
        key: j.memberExpression(j.identifier(varName), j.identifier('key')),
        value: j.identifier(varName),
        computed: true
      })
    );
  } else {
    const maybeApp = root.find(j.VariableDeclaration, {
      declarations: [{ id: { type: 'Identifier', name: 'App' } }]
    });
    if (maybeApp.length) {
      maybeApp.get().node.declarations[0].init.properties.push(
        j.property(
          'init',
          j.identifier(property),
          j.objectExpression([
            j.property.from({
              kind: 'init',
              key: j.memberExpression(
                j.identifier(varName),
                j.identifier('key')
              ),
              value: j.identifier(varName),
              computed: true
            })
          ])
        )
      );
    } else {
      throw new Error(
        `Unable to add new property "${property}" to exported app. Can't find variable declaration for "App". To fix, either ensure there is a variable called "App" in your root file or add \`${property}: {},\` to your existing app. Then, re-run this command.\``
      );
    }

    // create that property on App
    // find const App =
    // find the thing that's module.export = ?
  }
  return root.toSource();
};

module.exports = { createRootRequire, addKeyToPropertyOnApp };
