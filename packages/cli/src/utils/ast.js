// tools for modifiyng an AST

const j = require('jscodeshift');

const createRootRequire = (codeStr, varName, path) => {
  const root = j(codeStr);
  // insert a new require statement after all other requires (that get put into variables, like might happen at the top-level)
  root
    // searching for VariableDeclaration, like `const x = require('y')`
    .find(j.VariableDeclaration, {
      declarations: [
        { init: { type: 'CallExpression', callee: { name: 'require' } } }
      ]
    })
    // filters for top-level require statements
    .filter(path => j.Program.check(path.parent.value))
    .at(-1)
    // TODO: detect duplicate identifier?
    .insertAfter(
      j.variableDeclaration('const', [
        j.variableDeclarator(
          j.identifier(varName),
          j.callExpression(j.identifier('require'), [j.literal(path)])
        )
      ])
    );

  return root.toSource();
};

const addKeyToPropertyOnApp = (codeStr, property, varName) => {
  // to play with this, use https://astexplorer.net/#/gist/cb4986b3f1c6eb975339608109a48e7d/0fbf2fabbcf27d0b6ebd8910f979bd5d97dd9404
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
        `Unable to add new property ${property} to exported app: Can't find variable declaration for "App". To fix, add \`${property}: {} to your exported app object and re-run the command.\``
      );
    }

    // create that property on App
    // find const App =
    // find the thing that's module.export = ?
  }
  return root.toSource();
};

module.exports = { createRootRequire, addKeyToPropertyOnApp };
