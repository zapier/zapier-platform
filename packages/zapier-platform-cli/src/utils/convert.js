const _ = require('lodash');
const path = require('path');
const prettier = require('prettier');
const stripComments = require('strip-comments');
const { camelCase, snakeCase } = require('./misc');
const { copyFile, readFile, writeFile, ensureDir } = require('./files');
const { printStarting, printDone } = require('./display');
const { PACKAGE_VERSION } = require('../constants');

const TEMPLATE_DIR = path.join(__dirname, '../../scaffold/convert');
const ZAPIER_LEGACY_SCRIPTING_RUNNER_VERSION = '1.1.0';

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
  'Unknown Auth': 'custom'
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

// map CLI step names to WB
const stepNamesMapInv = {
  trigger: 'triggers',
  search: 'searches',
  create: 'actions'
};

const stepTypeMap = {
  trigger: 'triggers',
  search: 'searches',
  create: 'creates'
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

const renderTemplate = (templateFile, templateContext, prettify = true) => {
  return readFile(templateFile)
    .then(templateBuf => templateBuf.toString())
    .then(template =>
      _.template(template, { interpolate: /<%=([\s\S]+?)%>/g })(templateContext)
    )
    .then(content => {
      if (prettify) {
        const ext = path.extname(templateFile).toLowerCase();
        const prettifier = {
          '.json': origString =>
            JSON.stringify(JSON.parse(origString), null, 2),
          '.js': origString =>
            prettier.format(origString, {
              singleQuote: true,
              printWidth: 120
            })
        }[ext];
        if (prettifier) {
          return prettifier(content);
        }
      }
      return content;
    });
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

const renderProp = (key, value) => `${key}: ${value}`;

const quote = s => `'${s}'`;

const escapeSpecialChars = s => s.replace(/\n/g, '\\n').replace(/'/g, "\\'");

const getAuthType = definition => {
  return authTypeMap[definition.general.auth_type];
};

const hasAuth = definition => {
  return (
    getAuthType(definition) !== 'custom' && !_.isEmpty(definition.auth_fields)
  );
};

const renderField = (definition, key, indent = 0) => {
  const type =
    (definition.type && typesMap[definition.type.toLowerCase()]) || 'string';

  let props = [];

  props.push(renderProp('key', quote(key)));
  if (definition.label) {
    props.push(
      renderProp('label', quote(escapeSpecialChars(definition.label)))
    );
  }

  if (definition.help_text) {
    props.push(
      renderProp('helpText', quote(escapeSpecialChars(definition.help_text)))
    );
  }

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

  if (definition.default) {
    props.push(
      renderProp('default', quote(escapeSpecialChars(definition.default)))
    );
  }

  if (definition.choices) {
    const choices = {};
    _.each(definition.choices.split(','), choice => {
      const parts = choice.split('|');
      const choiceKey = parts[0].trim();
      const choiceLabel =
        parts.length > 1 ? parts[1].trim() : _.startCase(choiceKey);
      choices[choiceKey] = choiceLabel;
    });

    props.push(renderProp('choices', JSON.stringify(choices)));
  }

  props = props.map(s => ' '.repeat(indent + 2) + s);
  const padding = ' '.repeat(indent);

  return `${padding}{
${props.join(',\n')}
${padding}}`;
};

const renderFields = (fields, indent = 0) => {
  const results = [];
  _.each(fields, (field, key) => {
    results.push(renderField(field, key, indent));
  });
  return results.join(',\n');
};

// TODO: Reuse code with renderField()
const renderSampleField = (def, indent = 0) => {
  const type = typesMap[def.type] || 'string';

  let props = [];

  props.push(renderProp('key', quote(def.key)));
  props.push(renderProp('type', quote(type)));

  if (def.label) {
    props.push(renderProp('label', quote(def.label)));
  }

  props = props.map(s => ' '.repeat(indent + 2) + s);
  const padding = ' '.repeat(indent);

  return `${padding}{
${props.join(',\n')}
${padding}}`;
};

const renderSampleFields = (fields, indent = 0) => {
  const results = [];
  _.each(fields, field => {
    results.push(renderSampleField(field, indent));
  });
  return results.join(',\n');
};

// Get some quick metadata on auth scripting methods
const getAuthMetaData = definition => {
  const js = definition.js ? stripComments(definition.js) : '';

  const hasPreOAuthTokenScripting = js.indexOf('pre_oauthv2_token') > 0;
  const hasPostOAuthTokenScripting = js.indexOf('post_oauthv2_token') > 0;
  const hasPreOAuthRefreshScripting = js.indexOf('pre_oauthv2_refresh') > 0;
  const hasGetConnectionLabelScripting = js.indexOf('get_connection_label') > 0;

  return {
    hasPreOAuthTokenScripting,
    hasPostOAuthTokenScripting,
    hasPreOAuthRefreshScripting,
    hasGetConnectionLabelScripting
  };
};

const getTestTriggerKey = definition => {
  return _.get(definition, ['general', 'test_trigger_key']);
};

const renderAuthTemplate = (authType, definition) => {
  const fields = renderFields(definition.auth_fields, 4);
  const connectionLabel = _.get(definition, ['general', 'auth_label'], '');
  const { hasGetConnectionLabelScripting } = getAuthMetaData(definition);

  if (authType === 'basic' && !_.isEmpty(definition.general.auth_mapping)) {
    authType = 'custom';
  }

  const templateContext = {
    TYPE: authType,
    FIELDS: fields,
    CONNECTION_LABEL: connectionLabel,
    hasGetConnectionLabelScripting
  };

  const testTriggerKey = getTestTriggerKey(definition);
  if (testTriggerKey) {
    templateContext.TEST_TRIGGER_MODULE = `./triggers/${snakeCase(
      testTriggerKey
    )}`;
  } else {
    templateContext.TEST_TRIGGER_MODULE = '';
  }

  const templateFile = path.join(TEMPLATE_DIR, '/simple-auth.template.js');
  return renderTemplate(templateFile, templateContext);
};

const renderBasicAuth = _.bind(renderAuthTemplate, null, 'basic');
const renderCustomAuth = _.bind(renderAuthTemplate, null, 'custom');

const renderOAuth2 = (definition, withRefresh) => {
  const authorizeUrl = _.get(
    definition,
    ['general', 'auth_urls', 'authorization_url'],
    'TODO'
  );
  const accessTokenUrl = _.get(
    definition,
    ['general', 'auth_urls', 'access_token_url'],
    'TODO'
  );
  const refreshTokenUrl = _.get(
    definition,
    ['general', 'auth_urls', 'refresh_token_url'],
    'TODO'
  );
  const connectionLabel = _.get(definition, ['general', 'auth_label'], '');
  const scope = _.get(definition, ['general', 'auth_data', 'scope'], '');
  const testTriggerKey = getTestTriggerKey(definition);

  const {
    hasPreOAuthTokenScripting,
    hasPostOAuthTokenScripting,
    hasPreOAuthRefreshScripting,
    hasGetConnectionLabelScripting
  } = getAuthMetaData(definition);

  const templateContext = {
    TEST_TRIGGER_MODULE: `./triggers/${snakeCase(testTriggerKey)}`,
    AUTHORIZE_URL: authorizeUrl,
    ACCESS_TOKEN_URL: accessTokenUrl,
    REFRESH_TOKEN_URL: refreshTokenUrl,
    CONNECTION_LABEL: connectionLabel,
    SCOPE: scope,

    withRefresh,

    hasPreOAuthTokenScripting,
    hasPostOAuthTokenScripting,
    hasPreOAuthRefreshScripting,
    hasGetConnectionLabelScripting

    // TODO: Extra fields?
  };

  const templateFile = path.join(TEMPLATE_DIR, '/oauth2.template.js');
  return renderTemplate(templateFile, templateContext);
};

const renderSessionAuth = definition => {
  const fields = renderFields(definition.auth_fields, 4);
  const connectionLabel = _.get(definition, ['general', 'auth_label'], '');
  const testTriggerKey = getTestTriggerKey(definition);

  const { hasGetConnectionLabelScripting } = getAuthMetaData(definition);

  const templateContext = {
    TEST_TRIGGER_MODULE: `./triggers/${snakeCase(testTriggerKey)}`,
    FIELDS: fields,
    CONNECTION_LABEL: connectionLabel,

    hasGetConnectionLabelScripting
  };

  const templateFile = path.join(TEMPLATE_DIR, '/session.template.js');
  return renderTemplate(templateFile, templateContext);
};

const renderAuth = definition => {
  const type = getAuthType(definition);

  if (type === 'basic') {
    return renderBasicAuth(definition);
  } else if (type === 'oauth2') {
    return renderOAuth2(definition);
  } else if (type === 'oauth2-refresh') {
    return renderOAuth2(definition, true);
  } else if (
    type === 'custom' ||
    type === 'api-header' ||
    type === 'api-query'
  ) {
    return renderCustomAuth(definition);
  } else if (type === 'session') {
    return renderSessionAuth(definition);
  } else {
    return Promise.resolve(`{
    // TODO: complete auth settings
  }`);
  }
};

// write authentication.js
const writeAuth = (definition, newAppDir) => {
  const fileName = 'authentication.js';
  return renderAuth(definition).then(content =>
    createFile(content, fileName, newAppDir)
  );
};

// Check if scripting has a given method for a step type, key, position (pre, post, full),
// and method_type (step, resource, input_fields, output_fields)
const hasScriptingMethod = (js, type, key, position, method_type = 'step') => {
  if (!js) {
    return false;
  }

  const suffixTable = {
    trigger: {
      pre: {
        step: '_pre_poll',
        output_fields: '_pre_custom_trigger_fields'
      },
      post: {
        step: '_post_poll',
        output_fields: '_post_custom_trigger_fields'
      },
      full: {
        step: '_poll'
      }
    },
    create: {
      pre: {
        step: '_pre_write',
        input_fields: '_pre_custom_action_fields',
        output_fields: '_pre_custom_action_result_fields'
      },
      post: {
        step: '_post_write',
        input_fields: '_post_custom_action_fields',
        output_fields: '_post_custom_action_result_fields'
      },
      full: {
        step: '_write',
        input_fields: '_custom_action_fields',
        output_fields: '_custom_action_result_fields'
      }
    },
    search: {
      pre: {
        step: '_pre_search',
        resource: '_pre_read_resource',
        input_fields: '_pre_custom_search_fields',
        output_fields: '_pre_custom_search_result_fields'
      },
      post: {
        step: '_post_search',
        resource: '_post_read_resource',
        input_fields: '_post_custom_search_fields',
        output_fields: '_post_custom_search_result_fields'
      },
      full: {
        step: '_search',
        resource: '_read_resource',
        input_fields: '_custom_search_fields',
        output_fields: '_custom_search_result_fields'
      }
    }
  };

  const methodSuffix = suffixTable[type][position][method_type];
  if (!methodSuffix) {
    return false;
  }

  // Whole word search. '\b' regex matches a word boundary.
  const methodName = `${key}${methodSuffix}`;
  return new RegExp('\\b' + methodName + '\\b').test(js);
};

// Get some quick meta data for templates, regarding a scripting and a step
const getStepMetaData = (definition, type, key) => {
  const js = definition.js ? stripComments(definition.js) : '';

  const hasPreScripting = hasScriptingMethod(js, type, key, 'pre');
  const hasPostScripting = hasScriptingMethod(js, type, key, 'post');
  const hasFullScripting = hasScriptingMethod(js, type, key, 'full');

  const hasResourcePreScripting = hasScriptingMethod(
    js,
    type,
    key,
    'pre',
    'resource'
  );
  const hasResourcePostScripting = hasScriptingMethod(
    js,
    type,
    key,
    'post',
    'resource'
  );
  const hasResourceFullScripting = hasScriptingMethod(
    js,
    type,
    key,
    'full',
    'resource'
  );

  const hasInputFieldPreScripting = hasScriptingMethod(
    js,
    type,
    key,
    'pre',
    'input_fields'
  );
  const hasInputFieldPostScripting = hasScriptingMethod(
    js,
    type,
    key,
    'post',
    'input_fields'
  );
  const hasInputFieldFullScripting = hasScriptingMethod(
    js,
    type,
    key,
    'full',
    'input_fields'
  );

  const hasOutputFieldPreScripting = hasScriptingMethod(
    js,
    type,
    key,
    'pre',
    'output_fields'
  );
  const hasOutputFieldPostScripting = hasScriptingMethod(
    js,
    type,
    key,
    'post',
    'output_fields'
  );
  const hasOutputFieldFullScripting = hasScriptingMethod(
    js,
    type,
    key,
    'full',
    'output_fields'
  );

  const hasScripting =
    hasPreScripting ||
    hasPostScripting ||
    hasFullScripting ||
    hasResourcePreScripting ||
    hasResourcePostScripting ||
    hasResourceFullScripting ||
    hasInputFieldPreScripting ||
    hasInputFieldPostScripting ||
    hasInputFieldFullScripting ||
    hasOutputFieldPreScripting ||
    hasOutputFieldPostScripting ||
    hasOutputFieldFullScripting;

  const stepDef = definition[stepNamesMapInv[type]][key];

  const hasCustomInputFields =
    hasInputFieldPreScripting ||
    hasInputFieldPostScripting ||
    hasInputFieldFullScripting ||
    (type !== 'trigger' && Boolean(stepDef.custom_fields_url));
  // Triggers in WB don't have custom input fields
  const hasCustomOutputFields =
    hasOutputFieldPreScripting ||
    hasOutputFieldPostScripting ||
    hasOutputFieldFullScripting ||
    (Boolean(stepDef.custom_fields_result_url) ||
      (type === 'trigger' && Boolean(stepDef.custom_fields_url)));
  // Triggers' custom output fields URL route is specified by 'custom_fields_url', unlike creates and searches

  return {
    hasScripting,
    hasPreScripting,
    hasPostScripting,
    hasFullScripting,
    hasResourcePreScripting,
    hasResourcePostScripting,
    hasResourceFullScripting,
    hasInputFieldPreScripting,
    hasInputFieldPostScripting,
    hasInputFieldFullScripting,
    hasOutputFieldPreScripting,
    hasOutputFieldPostScripting,
    hasOutputFieldFullScripting,
    hasCustomInputFields,
    hasCustomOutputFields
  };
};

// Get some quick converted metadata for several templates to use
const getMetaData = definition => {
  const type = getAuthType(definition);

  const authPlacement = _.get(definition.general, [
    'auth_data',
    'access_token_placement'
  ]);

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

  const needsAuth = hasAuth(definition);
  const isCustomBasic =
    needsAuth &&
    type === 'basic' &&
    !_.isEmpty(definition.general.auth_mapping);
  const hasBefore =
    needsAuth &&
    (type === 'api-header' ||
      type === 'api-query' ||
      type === 'session' ||
      type === 'oauth2' ||
      type === 'oauth2-refresh' ||
      isCustomBasic);
  const hasAfter = needsAuth && type === 'session';
  const fieldsOnQuery = authPlacement === 'params' || type === 'api-query';
  const isSession = needsAuth && type === 'session';
  const isOAuth = needsAuth && (type === 'oauth2' || type === 'oauth2-refresh');

  const needsLegacyScriptingRunner = isSession || hasAnyScriptingMethods;

  return {
    type,
    hasBefore,
    hasAfter,
    fieldsOnQuery,
    isSession,
    isOAuth,
    isCustomBasic,
    needsLegacyScriptingRunner
  };
};

// Generate methods for beforeRequest and afterResponse
const getHeader = definition => {
  const {
    hasBefore,
    hasAfter,
    isSession,
    isOAuth,
    isCustomBasic,
    fieldsOnQuery
  } = getMetaData(definition);

  if (hasBefore || hasAfter) {
    const templateContext = {
      before: hasBefore,
      after: hasAfter,
      session: isSession,
      oauth: isOAuth,
      customBasic: isCustomBasic,
      fields: Object.keys(definition.auth_fields),
      mapping: _.get(definition, ['general', 'auth_mapping'], {}),
      query: fieldsOnQuery
    };
    const templateFile = path.join(TEMPLATE_DIR, '/header.template.js');
    return renderTemplate(templateFile, templateContext);
  } else {
    return Promise.resolve('');
  }
};

// Return methods to use for beforeRequest
const getBeforeRequests = definition => {
  const { hasBefore } = getMetaData(definition);

  if (hasBefore) {
    return 'maybeIncludeAuth';
  }

  return null;
};

// Return methods to use for afterResponse
const getAfterResponses = definition => {
  const { hasAfter } = getMetaData(definition);

  if (hasAfter) {
    return 'maybeRefresh';
  }

  return null;
};

// convert a trigger, create or search
const renderStep = (type, definition, key, legacyApp) => {
  const stepMeta = getStepMetaData(legacyApp, type, key);

  const fields = renderFields(definition.fields, 6);
  const sampleFields = renderSampleFields(definition.sample_result_fields, 6);
  const sample = JSON.stringify(definition.sample_result) || 'null';

  const url = definition.url
    ? definition.url
    : 'http://example.com/api/${key}.json';

  const noun = definition.noun || _.capitalize(key);
  const label = definition.label || `${stepVerbsMap[type]} ${noun}`;

  const lowerNoun = noun.toLowerCase();
  const description =
    definition.help_text ||
    stepDescriptionTemplateMap[type]({ lowerNoun: lowerNoun });

  const hidden = Boolean(definition.hide);
  const important = Boolean(definition.important);

  const templateContext = {
    KEY: snakeCase(key),
    NOUN: noun,
    DESCRIPTION: escapeSpecialChars(description),
    LABEL: escapeSpecialChars(label),
    HIDDEN: hidden,
    IMPORTANT: important,
    FIELDS: fields,
    SAMPLE_FIELDS: sampleFields,
    SAMPLE: sample,
    URL: url,
    scripting: stepMeta.hasScripting,
    preScripting: stepMeta.hasPreScripting,
    postScripting: stepMeta.hasPostScripting,
    fullScripting: stepMeta.hasFullScripting,
    resourcePreScripting: stepMeta.hasResourcePreScripting,
    resourcePostScripting: stepMeta.hasResourcePostScripting,
    resourceFullScripting: stepMeta.hasResourceFullScripting,
    inputFieldPreScripting: stepMeta.hasInputFieldPreScripting,
    inputFieldPostScripting: stepMeta.hasInputFieldPostScripting,
    inputFieldFullScripting: stepMeta.hasInputFieldFullScripting,
    outputFieldPreScripting: stepMeta.hasOutputFieldPreScripting,
    outputFieldPostScripting: stepMeta.hasOutputFieldPostScripting,
    outputFieldFullScripting: stepMeta.hasOutputFieldFullScripting,
    hasCustomInputFields: stepMeta.hasCustomInputFields,
    hasCustomOutputFields: stepMeta.hasCustomOutputFields
  };

  if (type === 'search') {
    templateContext.RESOURCE_URL = definition.resource_url;
  }

  if (definition.custom_fields_url) {
    templateContext.CUSTOM_FIELDS_URL = definition.custom_fields_url;
  }
  if (definition.custom_fields_result_url) {
    templateContext.CUSTOM_FIELDS_RESULT_URL =
      definition.custom_fields_result_url;
  }

  if (
    type === 'create' &&
    !stepMeta.hasPreScripting &&
    !stepMeta.hasFullScripting
  ) {
    // Exclude create fields that uncheck "Send to Action Endpoint URL in JSON body"
    // https://zapier.com/developer/documentation/v2/action-fields/#send-to-action-endpoint-url-in-json-body
    const fieldKeys = _.keys(definition.fields);
    const excludeFieldKeys = _.filter(
      fieldKeys,
      k => !definition.fields[k].send_in_json
    );
    templateContext.excludeFieldKeys = excludeFieldKeys || null;
  }

  const templateFile = path.join(TEMPLATE_DIR, `/${type}.template.js`);
  return renderTemplate(templateFile, templateContext);
};

// write a new trigger, create, or search
const writeStep = (type, definition, key, legacyApp, newAppDir) => {
  const fileName = `${stepTypeMap[type]}/${snakeCase(key)}.js`;

  return renderStep(type, definition, key, legacyApp).then(content =>
    createFile(content, fileName, newAppDir)
  );
};

// render the authData used in the trigger/search/create test code
const renderAuthData = definition => {
  const authType = getAuthType(definition);
  let result;
  switch (authType) {
    case 'api-header': // fall through
    case 'api-query': // fall through
    case 'basic': {
      let lines = _.map(definition.auth_fields, (field, key) => {
        const upperKey = key.toUpperCase();
        return `        ${key}: process.env.${upperKey}`;
      });
      result = `{
${lines.join(',\n')}
      }`;
      break;
    }
    case 'oauth2':
      result = `{
        access_token: process.env.ACCESS_TOKEN
      }`;
      break;
    case 'oauth2-refresh':
      result = `{
        access_token: process.env.ACCESS_TOKEN,
        refresh_token: process.env.REFRESH_TOKEN
      }`;
      break;
    case 'session':
      result = `{
        sessionKey: process.env.SESSION_KEY
      }`;
      break;
    default:
      result = `{
        // TODO: Put your custom auth data here
      }`;
      break;
  }
  return result;
};

const renderDefaultInputData = definition => {
  const lines = [];
  _.each(definition.fields, (field, key) => {
    if (field.default || field.required) {
      const defaultValue = field.default
        ? quote(escapeSpecialChars(field.default))
        : null;
      lines.push(`'${key}': ${defaultValue}`);
    }
  });

  if (lines.length === 0) {
    return '{}';
  }
  return `{
    // TODO: Pulled from input fields' default values. Edit if necessary.
    ${lines.join(',\n')}
  }`;
};

const renderStepTest = (type, definition, key, legacyApp) => {
  const label = definition.label || _.capitalize(key);
  const authData = renderAuthData(legacyApp);
  const inputData = renderDefaultInputData(definition);
  const templateContext = {
    KEY: key,
    LABEL: escapeSpecialChars(label),
    AUTH_DATA: authData,
    INPUT_DATA: inputData
  };
  const templateFile = path.join(TEMPLATE_DIR, `/${type}-test.template.js`);
  return renderTemplate(templateFile, templateContext);
};

// write basic test code for a new trigger, create, or search
const writeStepTest = (type, definition, key, legacyApp, newAppDir) => {
  // Skip auth test, as it should return an object instead of an array
  if (
    type === 'trigger' &&
    _.get(legacyApp, ['general', 'test_trigger_key']) === key
  ) {
    return Promise.resolve();
  }
  const fileName = `test/${stepTypeMap[type]}/${snakeCase(key)}.js`;
  return renderStepTest(type, definition, key, legacyApp).then(content =>
    createFile(content, fileName, newAppDir)
  );
};

const renderUtils = () => {
  const templateFile = path.join(TEMPLATE_DIR, '/utils.template.js');
  return renderTemplate(templateFile);
};

const writeUtils = newAppDir => {
  const fileName = 'utils.js';
  return renderUtils().then(content =>
    createFile(content, fileName, newAppDir)
  );
};

const findSearchOrCreates = legacyApp => {
  let searchOrCreates = {};
  _.each(legacyApp.searches, (searchDef, searchKey) => {
    if (searchDef.action_pair_key) {
      // The key for a searchOrCreate (comboKey) has to match the key of a
      // search due to frontend constraints. From Platform's perspective
      // though, a searchOrCreate just needs a unique key that could be
      // anything.
      const comboKey = searchKey;
      searchOrCreates[comboKey] = {
        key: comboKey,
        display: {
          label: searchDef.action_pair_label || '',
          description: searchDef.action_pair_label || ''
        },
        search: searchKey,
        create: searchDef.action_pair_key
      };
    }
  });
  return searchOrCreates;
};

const renderIndex = legacyApp => {
  const needsAuth = hasAuth(legacyApp);
  const templateContext = {
    HEADER: '',
    TRIGGERS: '',
    SEARCHES: '',
    CREATES: '',
    BEFORE_REQUESTS: getBeforeRequests(legacyApp),
    AFTER_RESPONSES: getAfterResponses(legacyApp),
    needsAuth
  };

  return getHeader(legacyApp).then(header => {
    templateContext.HEADER = header;

    const importLines = [];

    if (needsAuth) {
      importLines.push("const authentication = require('./authentication');");
    }

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
        lines.push(`[${varName}.key]: ${varName}`);
      });

      const section = dirMap[cliType].toUpperCase();
      templateContext[section] = lines.join(',\n');
    });

    templateContext.REQUIRES = importLines.join('\n');

    const searchOrCreates = findSearchOrCreates(legacyApp);
    if (_.isEmpty(searchOrCreates)) {
      templateContext.SEARCH_OR_CREATES = null;
    } else {
      templateContext.SEARCH_OR_CREATES = JSON.stringify(
        searchOrCreates,
        null,
        2
      );
    }

    const templateFile = path.join(TEMPLATE_DIR, '/index.template.js');
    return renderTemplate(templateFile, templateContext);
  });
};

const writeIndex = (legacyApp, newAppDir) => {
  return renderIndex(legacyApp).then(content =>
    createFile(content, 'index.js', newAppDir)
  );
};

const renderPackageJson = legacyApp => {
  const { needsLegacyScriptingRunner } = getMetaData(legacyApp);

  // Not using escapeSpecialChars because we don't want to escape single quotes (not allowed in JSON)
  const description = legacyApp.general.description
    .replace(/\n/g, '\\n')
    .replace(/"/g, '\\"');

  const templateContext = {
    NAME: _.kebabCase(legacyApp.general.title),
    DESCRIPTION: description,
    APP_ID: legacyApp.general.app_id,
    CLI_VERSION: PACKAGE_VERSION
  };

  const dependencies = [];

  dependencies.push(`"zapier-platform-core": "${PACKAGE_VERSION}"`);

  if (needsLegacyScriptingRunner) {
    // TODO: Make conditional
    dependencies.push('"async": "2.5.0"');
    dependencies.push('"moment-timezone": "0.5.13"');
    dependencies.push('"xmldom": "0.1.27"');
    dependencies.push(
      `"zapier-platform-legacy-scripting-runner": "${ZAPIER_LEGACY_SCRIPTING_RUNNER_VERSION}"`
    );
  }

  templateContext.DEPENDENCIES = dependencies.join(',\n    ');

  const templateFile = path.join(TEMPLATE_DIR, '/package.template.json');
  return renderTemplate(templateFile, templateContext);
};

const writePackageJson = (legacyApp, newAppDir) => {
  return renderPackageJson(legacyApp).then(content =>
    createFile(content, 'package.json', newAppDir)
  );
};

const renderScripting = legacyApp => {
  const templateContext = {
    CODE: _.get(legacyApp, 'js'),
    VERSION: ZAPIER_LEGACY_SCRIPTING_RUNNER_VERSION
  };

  // Don't render the file if there's nothing to render
  if (!templateContext.CODE) {
    return Promise.resolve();
  }

  // Normalize newlines to '\n'
  templateContext.CODE = templateContext.CODE.replace(/\r\n/g, '\n').replace(
    /\r/g,
    '\n'
  );

  // Remove any 'use strict'; or "use strict"; since we add that automatically
  templateContext.CODE = templateContext.CODE.replace(
    "'use strict';\n",
    ''
  ).replace('"use strict";\n', '');

  const templateFile = path.join(TEMPLATE_DIR, '/scripting.template.js');
  return renderTemplate(templateFile, templateContext, false);
};

const writeScripting = (legacyApp, newAppDir) => {
  return renderScripting(legacyApp).then(content => {
    if (content) {
      return createFile(content, 'scripting.js', newAppDir);
    }

    return null;
  });
};

const renderEnvironment = definition => {
  const lines = _.map(definition.auth_fields, (field, key) => {
    const upperKey = key.toUpperCase();
    return `${upperKey}=YOUR_${upperKey}`;
  });
  return lines.join('\n');
};

const writeEnvironment = (legacyApp, newAppDir) => {
  const content = renderEnvironment(legacyApp);
  if (!content) {
    return Promise.resolve(null);
  }
  return createFile(content, '.environment', newAppDir);
};

const writeGitIgnore = newAppDir => {
  const srcPath = path.join(TEMPLATE_DIR, '/gitignore');
  const destPath = path.join(newAppDir, '/.gitignore');
  return copyFile(srcPath, destPath).then(() => {
    printStarting('Writing .gitignore');
    printDone();
  });
};

const convertApp = (legacyApp, newAppDir) => {
  const promises = [];
  _.each(stepNamesMap, (cliType, wbType) => {
    _.each(legacyApp[wbType], (definition, key) => {
      promises.push(writeStep(cliType, definition, key, legacyApp, newAppDir));
      promises.push(
        writeStepTest(cliType, definition, key, legacyApp, newAppDir)
      );
    });
  });

  promises.push(writeUtils(newAppDir));
  promises.push(writeIndex(legacyApp, newAppDir));
  promises.push(writePackageJson(legacyApp, newAppDir));
  promises.push(writeScripting(legacyApp, newAppDir));
  promises.push(writeEnvironment(legacyApp, newAppDir));
  promises.push(writeGitIgnore(newAppDir));

  if (hasAuth(legacyApp)) {
    promises.push(writeAuth(legacyApp, newAppDir));
  }

  return Promise.all(promises);
};

module.exports = {
  convertApp,
  renderAuth,
  renderField,
  renderIndex,
  renderSampleFields,
  renderScripting,
  renderStep,
  renderTemplate,

  // Mostly exported for testing
  getHeader,
  getBeforeRequests,
  getAfterResponses,
  hasAuth,
  renderPackageJson
};
