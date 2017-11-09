const _ = require('lodash');
const path = require('path');
const {camelCase, snakeCase} = require('./misc');
const {readFile, writeFile, ensureDir} = require('./files');
const {printStarting, printDone} = require('./display');

const MIN_HELP_TEXT_LENGTH = 10;
const TEMPLATE_DIR = path.join(__dirname, '../../scaffold/convert');
const ZAPIER_LEGACY_SCRIPTING_RUNNER_VERSION = '1.0.0';

// map WB auth types to CLI
const authTypeMap = {
  'Basic Auth': 'basic',
  // TODO: 'OAuth V1 (beta)': 'oauth1',
  'OAuth V2': 'oauth2',
  'OAuth V2 (w/refresh)': 'oauth2-refresh',
  'API Key (Headers)': 'api-header',
  'API Key (Query String)': 'api-query',
  'Session Auth': 'session',
  // TODO: 'Digest Auth': 'digest',
  'Unknown Auth': 'custom',
};

// map WB field types to CLI
const typesMap = {
  unicode: 'string',
  textarea: 'text',
  integer: 'integer',
  float: 'number',
  boolean: 'boolean',
  datetime: 'datetime',
  file: 'file',
  password: 'password'
};

// map WB step names to CLI
const stepNamesMap = {
  triggers: 'trigger',
  searches: 'search',
  actions: 'create'
};

// map CLI step names to verbs for display labels
const stepVerbsMap = {
  trigger: 'Get',
  create: 'Create',
  search: 'Find'
};

// map CLI step names to templates for descriptions
const stepDescriptionTemplateMap = {
  trigger: _.template('Triggers on a new <%= lowerNoun %>.'),
  create: _.template('Creates a <%= lowerNoun %>.'),
  search: _.template('Finds a <%= lowerNoun %>.')
};

const renderTemplate = (templateFile, templateContext) => {
  return readFile(templateFile)
    .then(templateBuf => templateBuf.toString())
    .then(template => _.template(template, {interpolate: /<%=([\s\S]+?)%>/g})(templateContext));
};

const createFile = (content, fileName, dir) => {
  const destFile = path.join(dir, fileName);

  return ensureDir(path.dirname(destFile))
    .then(() => writeFile(destFile, content))
    .then(() => {
      printStarting(`Writing ${fileName}`);
      printDone();
    });
};

const padHelpText = (text) => {
  const msg = `(help text must be at least ${MIN_HELP_TEXT_LENGTH} characters)`;
  if (!_.isString(text)) {
    return msg;
  }
  if (text.length < MIN_HELP_TEXT_LENGTH) {
    return `${text} ${msg}`;
  }
  return text;
};

const renderProp = (key, value) => `${key}: ${value}`;

const quote = s => `'${s}'`;

const renderField = (definition, key) => {
  const type = definition.type && typesMap[definition.type.toLowerCase()] || 'string';

  let props = [];

  props.push(renderProp('key', quote(key)));
  if (definition.label) {
    props.push(renderProp('label', quote(definition.label)));
  }
  props.push(renderProp('helpText', quote(padHelpText(definition.help_text))));
  props.push(renderProp('type', quote(type)));
  props.push(renderProp('required', Boolean(definition.required)));

  if (definition.placeholder) {
    props.push(renderProp('placeholder', quote(definition.placeholder)));
  }

  if (definition.prefill) {
    props.push(renderProp('dynamic', quote(definition.prefill)));
  }

  if (definition.searchfill) {
    props.push(renderProp('search', quote(definition.searchfill)));
  }

  props = props.map(s => ' '.repeat(8) + s);

  return `      {
${props.join(',\n')}
      }`;
};

const renderSampleField = (def) => {
  const type = typesMap[def.type] || 'string';
  if (def.label) {
    return `      {
        key: ${quote(def.key)},
        type: ${quote(type)},
        label: ${quote(def.label)}
      }`;
  }

  return `      {
        key: ${quote(def.key)},
        type: ${quote(type)}
      }`;
};

const renderSample = (definition) => {
  const fields = _.map(definition.sample_result_fields, renderSampleField);

  if (!fields.length) {
    return '';
  }

  return `    outputFields: [
${fields.join(',\n')}
    ]`;
};

const renderAuthTemplate = (authType, definition) => {
  const fields = _.map(definition.auth_fields, renderField);
  const connectionLabel = _.get(definition, ['general', 'auth_label'], '');

  const auth = `{
    type: '${authType}',
    test: AuthTest.operation.perform,
    fields: [
${fields.join(',\n')}
    ],
    connectionLabel: '${connectionLabel}'
  }`;

  return Promise.resolve(auth);
};

const renderBasicAuth = _.bind(renderAuthTemplate, null, 'basic');
const renderCustomAuth = _.bind(renderAuthTemplate, null, 'custom');

const renderOAuth2 = (definition, withRefresh) => {
  const authorizeUrl = _.get(definition, ['general', 'auth_urls', 'authorization_url'], 'TODO');
  const accessTokenUrl = _.get(definition, ['general', 'auth_urls', 'access_token_url'], 'TODO');
  const refreshTokenUrl = _.get(definition, ['general', 'auth_urls', 'refresh_token_url'], 'TODO');
  const connectionLabel = _.get(definition, ['general', 'auth_label'], '');
  const scope = _.get(definition, ['general', 'auth_data', 'scope'], '');

  const templateContext = {
    AUTHORIZE_URL: authorizeUrl,
    ACCESS_TOKEN_URL: accessTokenUrl,
    REFRESH_TOKEN_URL: refreshTokenUrl,
    CONNECTION_LABEL: connectionLabel,
    SCOPE: scope,
    // TODO: Extra fields?
  };

  const templateFileName = withRefresh ? 'oauth2-refresh' : 'oauth2';

  const templateFile = path.join(TEMPLATE_DIR, `/${templateFileName}.template.js`);
  return renderTemplate(templateFile, templateContext);
};

const renderSessionAuth = (definition) => {
  const fields = _.map(definition.auth_fields, renderField);
  const connectionLabel = _.get(definition, ['general', 'auth_label'], '');

  const templateContext = {
    FIELDS: fields.join(',\n'),
    CONNECTION_LABEL: connectionLabel,
  };

  const templateFile = path.join(TEMPLATE_DIR, '/session.template.js');
  return renderTemplate(templateFile, templateContext);
};

const renderAuth = (definition) => {
  const type = authTypeMap[definition.general.auth_type];

  if (type === 'basic') {
    return renderBasicAuth(definition);
  } else if (type === 'oauth2') {
    return renderOAuth2(definition);
  } else if (type === 'oauth2-refresh') {
    return renderOAuth2(definition, true);
  } else if (type === 'custom' || type === 'api-header' || type === 'api-query') {
    return renderCustomAuth(definition);
  } else if (type === 'session') {
    return renderSessionAuth(definition);
  } else {
    return Promise.resolve(`{
    // TODO: complete auth settings
  }`);
  }
};

// Check if scripting has a given method for a step type, key, and position (pre, post, full)
const hasScriptingMethod = (js, type, key, position) => {
  if (!js) {
    return false;
  }

  // TODO: Strip out comments from code

  let methodSuffix = '';

  if (type === 'trigger') {
    if (position === 'pre') {
      methodSuffix = '_pre_poll';
    } else if (position === 'post') {
      methodSuffix = '_post_poll';
    } else {
      methodSuffix = '_poll';
    }
  } else if (type === 'create') {
    if (position === 'pre') {
      methodSuffix = '_pre_write';
    } else if (position === 'post') {
      methodSuffix = '_post_write';
    } else {
      methodSuffix = '_write';
    }
  } else if (type === 'search') {
    if (position === 'pre') {
      methodSuffix = '_pre_search';
    } else if (position === 'post') {
      methodSuffix = '_post_search';
    } else {
      methodSuffix = '_search';
    }
  }

  const methodName = `${key}${methodSuffix}`;

  return (js.indexOf(methodName) !== -1);
};

// Get some quick meta data for templates, regarding a scripting and a step
const getStepMetaData = (definition, type, key) => {
  const hasPreScripting = hasScriptingMethod(_.get(definition, 'js'), type, key, 'pre');
  const hasPostScripting = hasScriptingMethod(_.get(definition, 'js'), type, key, 'post');
  const hasFullScripting = hasScriptingMethod(_.get(definition, 'js'), type, key, 'full');

  const hasScripting = hasPreScripting || hasPostScripting || hasFullScripting;

  return {
    hasScripting,
    hasPreScripting,
    hasPostScripting,
    hasFullScripting,
  };
};

// Get some quick converted metadata for several templates to use
const getMetaData = (definition) => {
  const type = authTypeMap[definition.general.auth_type];

  const authPlacement = _.get(definition.general, ['auth_data', 'access_token_placement']);

  let hasAnyScriptingMethods = false;

  // Check for all triggers/creates/searches for any necessary scripting methods
  _.each(stepNamesMap, (cliType, wbType) => {
    _.each(definition[wbType], (stepDefinition, key) => {
      const { hasScripting } = getStepMetaData(definition, cliType, key);
      if (hasScripting) {
        hasAnyScriptingMethods = true;
      }
    });
  });

  const hasBefore = (type === 'api-header' || type === 'api-query' || type === 'session' || type === 'oauth2' || type === 'oauth2-refresh');
  const hasAfter = (type === 'session');
  const fieldsOnQuery = (authPlacement === 'params' || type === 'api-query');
  const isSession = (type === 'session');
  const isOAuth = (type === 'oauth2' || type === 'oauth2-refresh');
  const needsLegacyScriptingRunner = isSession || hasAnyScriptingMethods;

  return {
    type,
    hasBefore,
    hasAfter,
    fieldsOnQuery,
    isSession,
    isOAuth,
    needsLegacyScriptingRunner,
  };
};

// Generate methods for beforeRequest and afterResponse
const getHeader = (definition) => {
  const {
    hasBefore,
    hasAfter,
    isSession,
    isOAuth,
    fieldsOnQuery,
  } = getMetaData(definition);

  if (hasBefore || hasAfter) {
    const templateContext = {
      before: hasBefore,
      after: hasAfter,
      session: isSession,
      oauth: isOAuth,
      fields: Object.keys(definition.auth_fields),
      mapping: _.get(definition, ['general', 'auth_mapping'], {}),
      query: fieldsOnQuery,
    };
    const templateFile = path.join(TEMPLATE_DIR, '/header.template.js');
    return renderTemplate(templateFile, templateContext);
  } else {
    return Promise.resolve('');
  }
};

// Return methods to use for beforeRequest
const getBeforeRequests = (definition) => {
  const { hasBefore } = getMetaData(definition);

  if (hasBefore) {
    return 'maybeIncludeAuth';
  }

  return null;
};

// Return methods to use for afterResponse
const getAfterResponses = (definition) => {
  const { hasAfter } = getMetaData(definition);

  if (hasAfter) {
    return 'maybeRefresh';
  }

  return null;
};

// convert a trigger, create or search
const renderStep = (type, definition, key, legacyApp) => {
  const {
    hasScripting,
    hasPreScripting,
    hasPostScripting,
    hasFullScripting,
  } = getStepMetaData(legacyApp, type, key);

  const fields = _.map(definition.fields, renderField);
  const sample = !_.isEmpty(definition.sample_result_fields) ? renderSample(definition) + ',\n' : '';

  const url = definition.url ? definition.url : 'http://example.com/api/${key}.json';

  const noun = definition.noun || _.capitalize(key);
  const label = definition.label || `${stepVerbsMap[type]} ${noun}`;

  const lowerNoun = noun.toLowerCase();
  let description = definition.help_text ||
                    stepDescriptionTemplateMap[type]({ lowerNoun: lowerNoun });
  description = description.replace(/'/g, "\\'");

  const hidden = Boolean(definition.hide);
  const important = Boolean(definition.important);

  const templateContext = {
    KEY: snakeCase(key),
    NOUN: noun,
    DESCRIPTION: description,
    LABEL: label,
    HIDDEN: hidden,
    IMPORTANT: important,
    FIELDS: fields.join(',\n'),
    SAMPLE: sample,
    URL: url,
    scripting: hasScripting,
    preScripting: hasPreScripting,
    postScripting: hasPostScripting,
    fullScripting: hasFullScripting,
  };

  const templateFile = path.join(TEMPLATE_DIR, `/${type}.template.js`);
  return renderTemplate(templateFile, templateContext);
};

// write a new trigger, create, or search
const writeStep = (type, definition, key, legacyApp, newAppDir) => {
  const stepTypeMap = {
    trigger: 'triggers',
    search: 'searches',
    create: 'creates'
  };

  const fileName = `${stepTypeMap[type]}/${snakeCase(key)}.js`;

  return renderStep(type, definition, key, legacyApp)
    .then(content => createFile(content, fileName, newAppDir));
};

const renderIndex = (legacyApp) => {
  const templateContext = {
    AUTHENTICATION: '',
    HEADER: '',
    TRIGGERS: '',
    SEARCHES: '',
    CREATES: '',
    BEFORE_REQUESTS: getBeforeRequests(legacyApp),
    AFTER_RESPONSES: getAfterResponses(legacyApp),
  };

  return renderAuth(legacyApp)
    .then((auth) => {
      templateContext.AUTHENTICATION = auth;
      return getHeader(legacyApp);
    })
    .then((header) => {
      templateContext.HEADER = header;

      const importLines = [];

      const dirMap = {
        trigger: 'triggers',
        search: 'searches',
        create: 'creates'
      };

      _.each(stepNamesMap, (cliType, wbType) => {
        const lines = [];

        _.each(legacyApp[wbType], (definition, name) => {
          const varName = `${camelCase(name)}${_.capitalize(camelCase(cliType))}`;
          const requireFile = `${dirMap[cliType]}/${snakeCase(name)}`;
          importLines.push(`const ${varName} = require('./${requireFile}');`);

          if (cliType === 'trigger' && _.get(legacyApp, ['general', 'test_trigger_key']) === name) {
            importLines.push(`const AuthTest = ${varName};`);
          }

          lines.push(`[${varName}.key]: ${varName}`);
        });

        const section = dirMap[cliType].toUpperCase();
        templateContext[section] = lines.join(',\n');
      });

      templateContext.REQUIRES = importLines.join('\n');

      const templateFile = path.join(TEMPLATE_DIR, '/index.template.js');
      return renderTemplate(templateFile, templateContext);
    });
};

const writeIndex = (legacyApp, newAppDir) => {
  return renderIndex(legacyApp)
    .then(content => createFile(content, 'index.js', newAppDir));
};

const renderPackageJson = (legacyApp) => {
  const { needsLegacyScriptingRunner } = getMetaData(legacyApp);

  const templateContext = {
    NAME: _.kebabCase(legacyApp.general.title),
    DESCRIPTION: legacyApp.general.description,
  };

  const zapierCoreVersion = require('../../package.json').version;

  const dependencies = [];

  dependencies.push(`"zapier-platform-core": "${zapierCoreVersion}"`);

  if (needsLegacyScriptingRunner) {
    // TODO: Make conditional
    dependencies.push('"async": "2.5.0"');
    dependencies.push('"moment-timezone": "0.5.13"');
    dependencies.push('"xmldom": "0.1.27"');
    dependencies.push(`"zapier-platform-legacy-scripting-runner": "${ZAPIER_LEGACY_SCRIPTING_RUNNER_VERSION}"`);
  }

  templateContext.DEPENDENCIES = dependencies.join(',\n    ');

  const templateFile = path.join(TEMPLATE_DIR, '/package.template.json');
  return renderTemplate(templateFile, templateContext);
};

const writePackageJson = (legacyApp, newAppDir) => {
  return renderPackageJson(legacyApp)
    .then(content => createFile(content, 'package.json', newAppDir));
};

const renderScripting = (legacyApp) => {
  const templateContext = {
    CODE: _.get(legacyApp, 'js'),
    VERSION: ZAPIER_LEGACY_SCRIPTING_RUNNER_VERSION,
  };

  // Don't render the file if there's nothing to render
  if (!templateContext.CODE) {
    return Promise.resolve();
  }

  // Remove any 'use strict'; or "use strict"; since we add that automatically
  templateContext.CODE = templateContext.CODE.replace("'use strict';\n", '').replace('"use strict";\n', '');

  const templateFile = path.join(TEMPLATE_DIR, '/scripting.template.js');
  return renderTemplate(templateFile, templateContext);
};

const writeScripting = (legacyApp, newAppDir) => {
  return renderScripting(legacyApp)
    .then(content => {
      if (content) {
        return createFile(content, 'scripting.js', newAppDir);
      }

      return null;
    });
};

const convertApp = (legacyApp, newAppDir) => {
  const promises = [];
  _.each(stepNamesMap, (cliType, wbType) => {
    _.each(legacyApp[wbType], (definition, key) => {
      promises.push(writeStep(cliType, definition, key, legacyApp, newAppDir));
    });
  });

  promises.push(writeIndex(legacyApp, newAppDir));
  promises.push(writePackageJson(legacyApp, newAppDir));
  promises.push(writeScripting(legacyApp, newAppDir));

  return Promise.all(promises);
};

module.exports = {
  convertApp,
  renderAuth,
  renderField,
  renderSample,
  renderStep,
  renderTemplate,

  // Mostly exported for testing
  getHeader,
  getBeforeRequests,
  getAfterResponses,
};
