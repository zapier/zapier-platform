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
  const root = j(codeStr);
  const subProp = root.find(j.Property, {
    key: { type: 'Identifier', name: property }
  });
  if (subProp.length) {
    // App has (for example) App.triggers
    subProp.get(0).node.value.properties.push(
      // creates a new property on that
      j.property.from({
        kind: 'init',
        key: j.memberExpression(j.identifier(varName), j.identifier('key')),
        value: j.identifier(varName),
        computed: true
      })
    );
  } else {
    // create that property on App
    // find const App =
    // find the thing that's module.export = ?
  }
  return root.toSource();
};

module.exports = { createRootRequire, addKeyToPropertyOnApp };
