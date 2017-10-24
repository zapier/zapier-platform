const _ = require('lodash');
const path = require('path');
const {camelCase, snakeCase} = require('./misc');
const {readFile, writeFile, ensureDir} = require('./files');
const {printStarting, printDone} = require('./display');

const MIN_HELP_TEXT_LENGTH = 10;
const TEMPLATE_DIR = path.join(__dirname, '../../scaffold/convert');

// map v2 field types to v2 types
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

// map v2 step names to cli names
const stepNamesMap = {
  triggers: 'trigger',
  searches: 'search',
  actions: 'create'
};

// map cli step names to verbs for display labels
const stepVerbsMap = {
  trigger: 'Get',
  create: 'Create',
  search: 'Find'
};

// map cli step names to templates for descriptions
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

const renderBasicAuth = (definition) => {
  const fields = _.map(definition.auth_fields, renderField);

  const auth = `{
    type: 'basic',
    test: {
      url: 'http://www.example.com/auth' // TODO just an example, you'll need to supply the real URL
    },
    fields: [
      ${fields.join(',\n')}
    ]
  }`;

  return Promise.resolve(auth);
};

const renderOAuth2 = (definition) => {
  const authorizeUrl = _.get(definition, ['general', 'auth_urls', 'authorization_url'], 'TODO');
  const accessTokenUrl = _.get(definition, ['general', 'auth_urls', 'access_token_url'], 'TODO');

  const templateContext = {
    AUTHORIZE_URL: authorizeUrl,
    ACCESS_TOKEN_URL: accessTokenUrl
  };

  const templateFile = path.join(TEMPLATE_DIR, '/oauth2.template.js');
  return renderTemplate(templateFile, templateContext);
};

const renderAuth = (definition) => {
  const authTypeMap = {
    'Basic Auth': 'basic',
    'OAuth V2': 'oauth2'
  };
  const type = authTypeMap[definition.general.auth_type];

  if (type === 'basic') {
    return renderBasicAuth(definition);
  } else if (type === 'oauth2') {
    return renderOAuth2(definition);
  } else {
    return Promise.resolve(`{
      // TODO: complete auth settings
    }`);
  }
};

// convert a trigger, create or search
const renderStep = (type, definition, key) => {
  const fields = _.map(definition.fields, renderField);
  const sample = !_.isEmpty(definition.sample_result_fields) ? renderSample(definition) + ',\n' : '';

  const url = definition.url ?
    quote(definition.url) + ',' :
    `'http://example.com/api/${key}.json', // TODO this is just an example`;

  const noun = definition.noun || _.capitalize(key);
  const label = definition.label || `${stepVerbsMap[type]} ${noun}`;

  const lowerNoun = noun.toLowerCase();
  let description = definition.help_text ||
                    stepDescriptionTemplateMap[type]({lowerNoun: lowerNoun});
  description = description.replace(/'/g, "\\'");

  const templateContext = {
    KEY: snakeCase(key),
    CAMEL: camelCase(key),
    NOUN: noun,
    LOWER_NOUN: lowerNoun,
    DESCRIPTION: description,
    LABEL: label,
    FIELDS: fields.join(',\n'),
    SAMPLE: sample,
    URL: url
  };

  const templateFile = path.join(TEMPLATE_DIR, `/${type}.template.js`);
  return renderTemplate(templateFile, templateContext);
};

// write a new trigger, create, or search
const writeStep = (type, definition, key, newAppDir) => {
  const stepTypeMap = {
    trigger: 'triggers',
    search: 'searches',
    create: 'creates'
  };

  const fileName = `${stepTypeMap[type]}/${snakeCase(key)}.js`;

  return renderStep(type, definition, key)
    .then(content => createFile(content, fileName, newAppDir));
};

const renderIndex = (legacyApp) => {
  return renderAuth(legacyApp).then(auth => {
    const importLines = [];

    const dirMap = {
      trigger: 'triggers',
      search: 'searches',
      create: 'creates'
    };

    const templateContext = {
      AUTHENTICATION: auth,
      TRIGGERS: '',
      SEARCHES: '',
      CREATES: ''
    };

    _.each(stepNamesMap, (cliType, v2Type) => {
      const lines = [];

      _.each(legacyApp[v2Type], (definition, name) => {
        const varName = `${camelCase(name)}${_.capitalize(camelCase(cliType))}`;
        const requireFile = `${dirMap[cliType]}/${snakeCase(name)}`;
        importLines.push(`const ${varName} = require('./${requireFile}');`);

        lines.push(`[${varName}.key]: ${varName},`);
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
  const templateContext = {
    NAME: _.kebabCase(legacyApp.general.title),
    DESCRIPTION: legacyApp.general.description,
    ZAPIER_CORE_VERSION: require('../../package.json').version
  };

  const templateFile = path.join(TEMPLATE_DIR, '/package.template.json');
  return renderTemplate(templateFile, templateContext);
};

const writePackageJson = (legacyApp, newAppDir) => {
  return renderPackageJson(legacyApp)
    .then(content => createFile(content, 'package.json', newAppDir));
};

const convertApp = (legacyApp, newAppDir) => {
  const promises = [];
  _.each(stepNamesMap, (cliType, v2Type) => {
    _.each(legacyApp[v2Type], (definition, key) => {
      promises.push(writeStep(cliType, definition, key, newAppDir));
    });
  });

  promises.push(writeIndex(legacyApp, newAppDir));
  promises.push(writePackageJson(legacyApp, newAppDir));

  return Promise.all(promises);
};

module.exports = {
  convertApp,
  renderAuth,
  renderField,
  renderSample,
  renderStep,
  renderTemplate,
};
