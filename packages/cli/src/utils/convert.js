const path = require('path');

const _ = require('lodash');
const prettier = require('prettier');
const semver = require('semver');

const {
  PACKAGE_VERSION,
  PLATFORM_PACKAGE,
  LAMBDA_VERSION,
  LEGACY_RUNNER_PACKAGE,
  IS_TESTING,
} = require('../constants');
const { copyFile, ensureDir, readFile, writeFile } = require('./files');
const { snakeCase } = require('./misc');
const { getPackageLatestVersion } = require('./npm');
let { startSpinner, endSpinner } = require('./display');

const TEMPLATE_DIR = path.join(__dirname, '../../scaffold/convert');

// A placeholder that can be used to identify this is something we need to replace
// before generating the final code. See replacePlaceholders function. Make it really
// special and NO regex reserved chars.
const REPLACE_DIRECTIVE = '__REPLACE_ME@';

// used to turn strings of code into real code
const makePlaceholder = (replacement) => `${REPLACE_DIRECTIVE}${replacement}`;

const replacePlaceholders = (str) =>
  str.replace(new RegExp(`"${REPLACE_DIRECTIVE}([^"]+)"`, 'g'), '$1');

const quote = (s) => `'${s}'`;

const escapeSpecialChars = (s) => s.replace(/\n/g, '\\n').replace(/'/g, "\\'");

const createFile = async (content, filename, dir) => {
  const destFile = path.join(dir, filename);
  await ensureDir(path.dirname(destFile));
  await writeFile(destFile, content);
  startSpinner(`Writing ${filename}`);
  endSpinner();
};

const prettifyJs = (code) =>
  prettier.format(code, { singleQuote: true, parser: 'babel' });
const prettifyJSON = (origString) => JSON.stringify(origString, null, 2);

const renderTemplate = async (
  templateFile,
  templateContext,
  prettify = true
) => {
  const templateBuf = await readFile(templateFile);
  const template = templateBuf.toString();
  let content = _.template(template, { interpolate: /<%=([\s\S]+?)%>/g })(
    templateContext
  );

  if (prettify) {
    const ext = path.extname(templateFile).toLowerCase();
    const prettifier = {
      '.json': (origString) => prettifyJSON(JSON.parse(origString)),
      '.js': prettifyJs,
    }[ext];
    if (prettifier) {
      content = prettifier(content);
    }
  }

  return content;
};

const getAuthFieldKeys = (appDefinition) => {
  const authFields = _.get(appDefinition, 'authentication.fields') || [];
  const fieldKeys = authFields.map((f) => f.key);

  const authType = _.get(appDefinition, 'authentication.type');
  switch (authType) {
    case 'basic': {
      fieldKeys.push('username', 'password');
      break;
    }
    case 'oauth1':
      fieldKeys.push('oauth_access_token');
      break;
    case 'oauth2':
      fieldKeys.push('access_token', 'refresh_token');
      break;
    default:
      fieldKeys.push(
        'oauth_consumer_key',
        'oauth_consumer_secret',
        'oauth_token',
        'oauth_token_secret'
      );
      break;
  }
  return fieldKeys;
};

const renderPackageJson = async (appInfo, appDefinition) => {
  const name = _.kebabCase(
    appInfo.title || _.get(appInfo, ['general', 'title'])
  );

  // Not using escapeSpecialChars because we don't want to escape single quotes (not
  // allowed in JSON)
  const description = (
    appInfo.description ||
    _.get(appInfo, ['general', 'description']) ||
    ''
  )
    .replace(/\n/g, '\\n')
    .replace(/"/g, '\\"');

  const version = appDefinition.version
    ? semver.inc(appDefinition.version, 'patch')
    : '1.0.0';

  const dependencies = {
    [PLATFORM_PACKAGE]: appDefinition.platformVersion,
  };
  if (appDefinition.legacy) {
    const runnerVersion = await getPackageLatestVersion(LEGACY_RUNNER_PACKAGE);
    dependencies[LEGACY_RUNNER_PACKAGE] = runnerVersion;
  }

  const zapierMeta = {
    convertedByCLIVersion: PACKAGE_VERSION,
  };
  const legacyAppId = _.get(appInfo, ['general', 'app_id']);
  if (legacyAppId) {
    zapierMeta.convertedFromAppID = legacyAppId;
  }

  const pkg = {
    name,
    version,
    description,
    main: 'index.js',
    scripts: {
      test: 'mocha --recursive -t 10000',
    },
    engines: {
      node: `>=${LAMBDA_VERSION}`,
      npm: '>=5.6.0',
    },
    dependencies,
    devDependencies: {
      mocha: '^5.2.0',
      should: '^13.2.0',
    },
    private: true,
    zapier: zapierMeta,
  };

  return prettifyJSON(pkg);
};

const renderStep = (type, definition) => {
  let exportBlock = _.cloneDeep(definition);
  let functionBlock = [];

  ['perform', 'performList', 'performSubscribe', 'performUnsubscribe'].forEach(
    (funcName) => {
      const func = definition.operation[funcName];
      if (func && func.source) {
        const args = func.args || ['z', 'bundle'];
        functionBlock.push(
          `const ${funcName} = async (${args.join(', ')}) => {\n${
            func.source
          }\n};`
        );

        exportBlock.operation[funcName] = makePlaceholder(funcName);
      }
    }
  );

  ['inputFields', 'outputFields'].forEach((key) => {
    const fields = definition.operation[key];
    if (Array.isArray(fields) && fields.length > 0) {
      // Godzilla currently doesn't allow mutliple dynamic fields (see PDE-948) but when it does, this will account for it
      let funcNum = 0;
      fields.forEach((maybeFunc, index) => {
        if (maybeFunc.source) {
          const args = maybeFunc.args || ['z', 'bundle'];
          // always increment the number, but only return a value if it's > 0
          const funcName = `get${_.upperFirst(key)}${
            funcNum ? funcNum++ : ++funcNum && ''
          }`;
          functionBlock.push(
            `const ${funcName} = async (${args.join(', ')}) => {\n${
              maybeFunc.source
            }\n};`
          );

          exportBlock.operation[key][index] = makePlaceholder(funcName);
        }
      });
    }
  });

  exportBlock = `module.exports = ${replacePlaceholders(
    JSON.stringify(exportBlock)
  )};\n`;

  functionBlock = functionBlock.join('\n\n');

  return prettifyJs(functionBlock + '\n\n' + exportBlock);
};

// Render authData for test code
const renderAuthData = (appDefinition) => {
  const fieldKeys = getAuthFieldKeys(appDefinition);
  const lines = _.map(fieldKeys, (key) => {
    const upperKey = _.snakeCase(key).toUpperCase();
    return `"${key}": process.env.${upperKey}`;
  });
  if (_.isEmpty(lines)) {
    return `{
      // TODO: Put your custom auth data here
    }`;
  }
  return '{' + lines.join(',\n') + '}';
};

const renderDefaultInputData = (definition) => {
  const lines = [];

  if (definition.inputFields) {
    definition.inputFields.forEach((field) => {
      if (field.default || field.required) {
        const defaultValue = field.default
          ? quote(escapeSpecialChars(field.default))
          : null;
        lines.push(`'${field.key}': ${defaultValue}`);
      }
    });
  }

  if (lines.length === 0) {
    return '{}';
  }
  return `{
    // TODO: Pulled from input fields' default values. Edit if necessary.
    ${lines.join(',\n')}
  }`;
};

const renderStepTest = async (stepType, definition, appDefinition) => {
  const templateName = {
    triggers: 'trigger-test.template.js',
    creates: 'create-test.template.js',
    searches: 'search-test.template.js',
  }[stepType];

  const templateContext = {
    key: definition.key,
    authData: renderAuthData(appDefinition),
    inputData: renderDefaultInputData(definition),
  };

  const templateFile = path.join(TEMPLATE_DIR, templateName);
  return renderTemplate(templateFile, templateContext);
};

const renderAuth = async (appDefinition) => {
  let exportBlock = _.cloneDeep(appDefinition.authentication);
  let functionBlock = [];

  _.each(
    {
      connectionLabel: 'getConnectionLabel',
      test: 'testAuth',
    },
    (funcName, key) => {
      const func = appDefinition.authentication[key];
      if (func && func.source) {
        const args = func.args || ['z', 'bundle'];
        functionBlock.push(
          `const ${funcName} = async (${args.join(', ')}) => {${func.source}};`
        );

        exportBlock[key] = makePlaceholder(funcName);
      }
    }
  );

  exportBlock = `module.exports = ${replacePlaceholders(
    JSON.stringify(exportBlock)
  )};\n`;

  functionBlock = functionBlock.join('\n\n');

  return prettifyJs(functionBlock + '\n\n' + exportBlock);
};

const renderHydrators = async (appDefinition) => {
  let exportBlock = _.cloneDeep(appDefinition.hydrators);
  let functionBlock = [];

  _.each(appDefinition.hydrators, (func, funcName) => {
    if (func && func.source) {
      const args = func.args || ['z', 'bundle'];
      functionBlock.push(
        `const ${funcName} = async (${args.join(', ')}) => {${func.source}};`
      );
      exportBlock[funcName] = makePlaceholder(funcName);
    }
  });

  exportBlock = `module.exports = ${replacePlaceholders(
    JSON.stringify(exportBlock)
  )};\n`;

  functionBlock = functionBlock.join('\n\n');

  return prettifyJs(functionBlock + '\n\n' + exportBlock);
};

const renderIndex = async (appDefinition) => {
  let exportBlock = _.cloneDeep(appDefinition);
  let functionBlock = [];
  let importBlock = [];

  // replace version and platformVersion with dynamic reference
  exportBlock.version = makePlaceholder("require('./package.json').version");
  exportBlock.platformVersion = makePlaceholder(
    "require('zapier-platform-core').version"
  );

  if (appDefinition.authentication) {
    importBlock.push("const authentication = require('./authentication');");
    exportBlock.authentication = makePlaceholder('authentication');
  }

  _.each(
    {
      triggers: 'Trigger',
      creates: 'Create',
      searches: 'Search',
    },
    (importNameSuffix, stepType) => {
      _.each(appDefinition[stepType], (definition, key) => {
        const importName = _.camelCase(key) + importNameSuffix;
        const filepath = `./${stepType}/${_.snakeCase(key)}.js`;

        importBlock.push(`const ${importName} = require('${filepath}');`);

        delete exportBlock[stepType][key];
        exportBlock[stepType][makePlaceholder(`[${importName}.key]`)] =
          makePlaceholder(importName);
      });
    }
  );

  if (!_.isEmpty(appDefinition.hydrators)) {
    importBlock.push("const hydrators = require('./hydrators');");
    exportBlock.hydrators = makePlaceholder('hydrators');
  }

  ['beforeRequest', 'afterResponse'].forEach((middlewareType) => {
    const middlewares = appDefinition[middlewareType];
    if (middlewares && middlewares.length > 0) {
      // Backend converter always generates only one middleware
      const func = middlewares[0];
      if (func.source) {
        const args = func.args || ['z', 'bundle'];
        const funcName = middlewareType;
        functionBlock.push(
          `const ${funcName} = async (${args.join(', ')}) => {${func.source}};`
        );

        exportBlock[middlewareType][0] = makePlaceholder(funcName);
      }
    }
  });

  if (appDefinition.legacy && appDefinition.legacy.scriptingSource) {
    importBlock.push("\nconst fs = require('fs');");
    importBlock.push(
      "const scriptingSource = fs.readFileSync('./scripting.js', { encoding: 'utf8' });"
    );
    exportBlock.legacy.scriptingSource = makePlaceholder('scriptingSource');
  }

  exportBlock = `module.exports = ${replacePlaceholders(
    JSON.stringify(exportBlock)
  )};`;

  importBlock = importBlock.join('\n');
  functionBlock = functionBlock.join('\n\n');

  return prettifyJs(
    importBlock + '\n\n' + functionBlock + '\n\n' + exportBlock
  );
};

const renderEnvironment = (appDefinition) => {
  const authFieldKeys = getAuthFieldKeys(appDefinition);
  const lines = _.map(authFieldKeys, (key) => {
    const upperKey = _.snakeCase(key).toUpperCase();
    return `${upperKey}=YOUR_${upperKey}`;
  });
  return lines.join('\n');
};

const writeStep = async (stepType, definition, key, newAppDir) => {
  const filename = `${stepType}/${snakeCase(key)}.js`;
  const content = await renderStep(stepType, definition);
  await createFile(content, filename, newAppDir);
};

const writeStepTest = async (
  stepType,
  definition,
  key,
  appDefinition,
  newAppDir
) => {
  const filename = `test/${stepType}/${snakeCase(key)}.js`;
  const content = await renderStepTest(stepType, definition, appDefinition);
  await createFile(content, filename, newAppDir);
};

const writeAuth = async (appDefinition, newAppDir) => {
  const content = await renderAuth(appDefinition, appDefinition);
  await createFile(content, 'authentication.js', newAppDir);
};

const writePackageJson = async (appInfo, appDefinition, newAppDir) => {
  const content = await renderPackageJson(appInfo, appDefinition);
  await createFile(content, 'package.json', newAppDir);
};

const writeHydrators = async (appDefinition, newAppDir) => {
  const content = await renderHydrators(appDefinition);
  await createFile(content, 'hydrators.js', newAppDir);
};

const writeScripting = async (appDefinition, newAppDir) => {
  await createFile(
    appDefinition.legacy.scriptingSource,
    'scripting.js',
    newAppDir
  );
};

const writeIndex = async (appDefinition, newAppDir) => {
  const content = await renderIndex(appDefinition);
  await createFile(content, 'index.js', newAppDir);
};

const writeEnvironment = async (appDefinition, newAppDir) => {
  const content = renderEnvironment(appDefinition);
  await createFile(content, '.env', newAppDir);
};

const writeGitIgnore = async (newAppDir) => {
  const srcPath = path.join(TEMPLATE_DIR, '/gitignore');
  const destPath = path.join(newAppDir, '/.gitignore');
  await copyFile(srcPath, destPath);
};

const writeZapierAppRc = async (appInfo, appDefinition, newAppDir) => {
  const json = {};
  if (appInfo.id) {
    json.id = appInfo.id;
  }
  if (appDefinition.legacy) {
    json.includeInBuild = ['scripting.js'];
  }
  const content = prettifyJSON(json);
  await createFile(content, '.zapierapprc', newAppDir);
};

const convertApp = async (appInfo, appDefinition, newAppDir) => {
  if (IS_TESTING) {
    startSpinner = endSpinner = () => null;
  }

  const promises = [];

  ['triggers', 'creates', 'searches'].forEach((stepType) => {
    _.each(appDefinition[stepType], (definition, key) => {
      promises.push(
        writeStep(stepType, definition, key, newAppDir),
        writeStepTest(stepType, definition, key, appDefinition, newAppDir)
      );
    });
  });

  if (!_.isEmpty(appDefinition.authentication)) {
    promises.push(writeAuth(appDefinition, newAppDir));
  }
  if (!_.isEmpty(appDefinition.hydrators)) {
    promises.push(writeHydrators(appDefinition, newAppDir));
  }
  if (_.get(appDefinition, 'legacy.scriptingSource')) {
    promises.push(writeScripting(appDefinition, newAppDir));
  }

  promises.push(
    writePackageJson(appInfo, appDefinition, newAppDir),
    writeIndex(appDefinition, newAppDir),
    writeEnvironment(appDefinition, newAppDir),
    writeGitIgnore(newAppDir),
    writeZapierAppRc(appInfo, appDefinition, newAppDir)
  );

  return Promise.all(promises);
};

module.exports = {
  renderTemplate,
  convertApp,
};
