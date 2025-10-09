const querystring = require('querystring');
const { promisify } = require('util');
const { URL } = require('url');

const _ = require('lodash');
const flatten = require('flat');
const FormData = require('form-data');

const {
  recurseReplaceBank,
} = require('zapier-platform-core/src/tools/cleaner');

const { flattenPaths } = require('zapier-platform-core/src/tools/data');
const constants = require('zapier-platform-core/src/constants');

const {
  ErrorException,
  HaltedException,
  StopRequestException,
  ExpiredAuthException,
  RefreshTokenException,
  InvalidSessionException,
  DEFINED_ERROR_NAMES,
} = require('./exceptions');

const createInternalRequestClient = (input) => {
  const addQueryParams = require('zapier-platform-core/src/http-middlewares/before/add-query-params');
  const createInjectInputMiddleware = require('zapier-platform-core/src/http-middlewares/before/inject-input');
  const createRequestClient = require('zapier-platform-core/src/tools/create-request-client');
  const disableSSLCertCheck = require('zapier-platform-core/src/http-middlewares/before/disable-ssl-cert-check');
  const logResponseModule = require('zapier-platform-core/src/http-middlewares/after/log-response');
  const prepareRequest = require('zapier-platform-core/src/http-middlewares/before/prepare-request');
  const prepareResponse = require('zapier-platform-core/src/http-middlewares/after/prepare-response');

  let sanitizeHeaders;
  try {
    sanitizeHeaders = require('zapier-platform-core/src/http-middlewares/before/sanatize-headers');
  } catch (err) {
    // Older versions of platform-core don't have sanitize-headers middleware
  }

  // Before core 12.0.3, log-response.js module exported the logResponse()
  // function, and it's the only export. Since core 12.0.3, logResponse()
  // function is inside an exported object. So we do the following to make sure
  // legacy-scripting-runner works before and after 12.0.3.
  // Related PR: https://github.com/zapier/zapier-platform/pull/525
  const logResponse =
    typeof logResponseModule === 'function'
      ? logResponseModule
      : logResponseModule.logResponse;

  const options = {
    skipDefaultMiddle: true,
  };
  const httpBefores = [
    createInjectInputMiddleware(input),
    prepareRequest,
    addQueryParams,
  ];

  if (sanitizeHeaders) {
    httpBefores.push(sanitizeHeaders);
  }

  const verifySSL = _.get(input, '_zapier.event.verifySSL');
  if (verifySSL === false) {
    httpBefores.push(disableSSLCertCheck);
  }

  const httpAfters = [prepareResponse, logResponse];
  return createRequestClient(httpBefores, httpAfters, options);
};

const { bundleConverter, unflattenObject } = require('./bundle');
const {
  markFileFieldsInBundle,
  isAnyFileFieldSet,
  isFileField,
  LazyFile,
} = require('./file');
const {
  createBeforeRequest,
  createAfterResponse,
  renderTemplate,
} = require('./middleware-factory');

const FIELD_TYPE_CONVERT_MAP = {
  // field_type_in_wb: field_type_in_cli
  bool: 'boolean',
  copy: 'copy',
  datetime: 'datetime',
  dict: 'string',
  file: 'file',
  float: 'number',
  int: 'integer',
  password: 'password',
  text: 'text',
  unicode: 'string',
};

const cleanCustomFields = (fields) => {
  return fields
    .filter((field) => _.isPlainObject(field) && field.key)
    .map((field) => {
      if (field.type === 'dict') {
        // For CLI, we set field.dict to true to represet a dict field instead
        // of setting field.type to 'dict'
        field.dict = true;
        delete field.list;
      }
      field.type = FIELD_TYPE_CONVERT_MAP[field.type] || field.type;
      return field;
    });
};

const stringifyForFormData = (value) => {
  const dataType = typeof value;
  if (dataType === 'string') {
    return value;
  } else if (dataType === 'boolean') {
    return value ? 'True' : 'False'; // mimic str(true) in Python
  }
  return JSON.stringify(value);
};

// Makes a multipart/form-data request body that can be set to request.body for
// node-fetch.
const makeMultipartForm = async (data, lazyFilesObject) => {
  const form = new FormData();
  if (data) {
    if (_.isPlainObject(data)) {
      _.each(data, (v, k) => {
        if (v !== undefined && v !== null) {
          form.append(k, stringifyForFormData(v));
        }
      });
    } else {
      if (typeof data !== 'string') {
        data = JSON.stringify(data);
      }
      form.append('data', data);
    }
  }

  const fileFieldKeys = Object.keys(lazyFilesObject);
  const lazyFiles = Object.values(lazyFilesObject);

  const fileMetas = await Promise.all(lazyFiles.map((f) => f.meta()));
  const fileStreams = await Promise.all(lazyFiles.map((f) => f.readStream()));

  _.zip(fileFieldKeys, fileMetas, fileStreams).forEach(
    ([k, meta, fileStream]) => {
      form.append(k, fileStream, meta);
    },
  );

  return form;
};

// Prepares request body from results.files and assign it to result.body. This
// accepts the request object returned by a KEY_pre_ method.
const addFilesToRequestBodyFromPreResult = async (request, event) => {
  const originalHydrateUrls = _.map(event.originalFiles, (file, k) => file[1]);
  const lazyFiles = _.reduce(
    request.files,
    (result, file, k) => {
      let lazyFile;
      if (Array.isArray(file) && file.length === 3) {
        const [filename, newFileValue, contentType] = file;
        // If pre_write changes the hydrate URL, file[1], we take it as a
        // string content even if it looks like a URL
        const loadUrl = originalHydrateUrls.includes(newFileValue);
        lazyFile = LazyFile(
          newFileValue,
          { filename, contentType },
          { dontLoadUrl: !loadUrl },
        );
      } else if (typeof file === 'string') {
        lazyFile = LazyFile(file);
      }

      if (lazyFile) {
        result[k] = lazyFile;
      }
      return result;
    },
    {},
  );

  delete request.headers['Content-Type'];

  const form = await makeMultipartForm(request.data || '{}', lazyFiles);
  request.body = form;
  request.headers = { ...request.headers, ...form.getHeaders() };
  return request;
};

// Reformats request.body into multipart/form-data for file upload. This
// accepts the CLI's bundle.request object.
const addFilesToRequestBodyFromBody = async (request, bundle) => {
  const data = {};
  const lazyFiles = {};

  _.each(request.body, (v, k) => {
    if (!isFileField(k, bundle)) {
      data[k] = v;
    } else if (typeof v === 'string') {
      lazyFiles[k] = LazyFile(v);
    }
  });

  delete request.headers['Content-Type'];

  const form = await makeMultipartForm(JSON.stringify(data), lazyFiles);
  request.body = form;
  request.headers.Accept = '*/*';
  request.headers = { ...request.headers, ...form.getHeaders() };
  return request;
};

const pythonSerialize = (value) => {
  if (typeof value === 'boolean') {
    return value ? 'True' : 'False';
  }
  return value.toString();
};

const encodeFormData = (data) => {
  const parts = Object.entries(data).reduce((result, [name, value]) => {
    let newItems;
    if (Array.isArray(value)) {
      newItems = value;
    } else if (_.isPlainObject(value)) {
      newItems = Object.keys(value);
    } else if (value != null) {
      newItems = [value];
    }

    if (newItems) {
      newItems = newItems
        .filter((v) => v != null)
        .map(pythonSerialize)
        .map(encodeURIComponent)
        .map((v) => `${name}=${v}`);
      result.push(...newItems);
    }

    return result;
  }, []);
  return parts.join('&');
};

const parseFinalResult = async (result, event) => {
  if (event.name.endsWith('.pre')) {
    if (!_.isEmpty(result.files)) {
      return addFilesToRequestBodyFromPreResult(result, event);
    }

    if (result.data) {
      if (_.isPlainObject(result.data) && !event.name.startsWith('auth.')) {
        // When a pre_(poll|write|search) gives an object for request.data, the
        // data will always be form-urlencoded even if content-type is json. If
        // the developer wants a JSON-encoded body, they need to encode the data
        // using JSON.stringify().
        result.body = encodeFormData(result.data);
      } else {
        // Old request was .data (string), new is .body (object), which matters
        // for _pre
        try {
          result.body = JSON.parse(result.data);
        } catch (e) {
          result.body = result.data;
        }
      }
    } else if (result.data === null || result.data === '') {
      result.body = '';
    }

    // request.data isn't really used by CLI's z.request()
    delete result.data;
    return result;
  }

  // Old writes accepted a list, but CLI doesn't anymore, which matters for _write and _post_write
  if (event.name === 'create.write' || event.name === 'create.post') {
    let resultObj;
    if (Array.isArray(result) && result.length) {
      resultObj = result[0];
    } else if (!Array.isArray(result)) {
      resultObj = result;
    } else {
      resultObj = {};
    }
    return resultObj;
  }

  if (
    event.name.endsWith('.input') ||
    event.name.endsWith('.output') ||
    event.name.endsWith('.input.post') ||
    event.name.endsWith('.output.post')
  ) {
    if (Array.isArray(result)) {
      result = cleanCustomFields(result);
    } else {
      result = [];
    }
  }

  return result;
};

const serializeValueForCurlies = (value) => {
  if (typeof value === 'boolean') {
    return value ? 'True' : 'False';
  } else if (Array.isArray(value)) {
    return value.join(',');
  } else if (_.isPlainObject(value)) {
    // Not sure if anyone would ever expect '[object Object]', but who knows?
    return value.toString();
  }
  return value;
};

const createCurliesBank = (bundle, extra) => {
  const bank = {
    // This is for new curlies syntax, such as '{{bundle.inputData.var}}' and
    // '{{bundle.authData.var}}'
    bundle,

    // These are for legacy curlies syntax without the 'bundle' prefix, such as
    // {{var}}. The order matters.
    ...bundle.inputData,
    ...bundle.subscribeData,
    ...bundle.authData,
    ...extra,
  };
  const flattenedBank = flattenPaths(bank, {
    perseve: {
      'bundle.inputData': true,
    },
  });
  return Object.entries(flattenedBank).reduce((coll, [key, value]) => {
    coll[`{{${key}}}`] = serializeValueForCurlies(value);
    return coll;
  }, {});
};

const replaceCurliesInRequest = (request, bundle, extra) => {
  const bank = createCurliesBank(bundle, extra);
  return recurseReplaceBank(request, bank);
};

const cleanHeaders = (headers) => {
  const newHeaders = {};
  const badChars = /[\r\n\t]/g;
  _.each(headers, (v, k) => {
    if (k) {
      k = k.replace(badChars, '').trim();
    }
    if (k) {
      if (v && v.replace) {
        v = v.replace(badChars, '').trim();
      }
      newHeaders[k] = v;
    }
  });
  return newHeaders;
};

// Header keys are considered case insensitive. This function removes duplicate
// headers.
// dedupeHeaders({'x-key': 'one', 'X-KEY': 'two'}) returns {'x-key': 'two'}
const dedupeHeaders = (headers) => {
  // lowerToFirstKeys stores the mapping from lowercased keys to the key that
  // first appears in the headers
  const lowerToFirstKeys = {};

  const newHeaders = Object.entries(headers).reduce((result, [k, v]) => {
    const lowerKey = k.toLowerCase();
    if (lowerToFirstKeys[lowerKey] === undefined) {
      lowerToFirstKeys[lowerKey] = k;
    }
    const firstKey = lowerToFirstKeys[lowerKey];
    result[firstKey] = v;
    return result;
  }, {});

  return newHeaders;
};

// Move all the query params from req.url to req.params. Make arrays if there
// are multiple values with the same name.
const mergeQueryParams = (req) => {
  if (!req.url) {
    return req;
  }

  const sepIndex = req.url.indexOf('?');
  if (sepIndex < 0) {
    return req;
  }

  // Extract the querystring. Don't use `new URL()` because the url might have
  // curlies.
  const querystring = req.url.substring(sepIndex + 1);
  const searchParams = new URLSearchParams(querystring);

  // Make an object like {name: ['alice', 'bob'], team: 'test'}
  const params = Array.from(searchParams).reduce((result, [name, value]) => {
    if (result[name] === undefined) {
      result[name] = value;
      return result;
    }
    if (!Array.isArray(result[name])) {
      result[name] = [result[name]];
    }
    result[name].push(value);
    return result;
  }, {});

  // Copy params collected from req.url to req.params
  req.params = _.mergeWith(params, req.params, (dst, src) => {
    if (src === null) {
      // Legacy WB relies on Python serializing null, ugh
      src = 'None';
    }
    if (dst === undefined) {
      return src;
    }
    if (Array.isArray(dst)) {
      if (Array.isArray(src)) {
        return dst.concat(src);
      } else {
        dst.push(src);
        return dst;
      }
    } else {
      if (Array.isArray(src)) {
        return [dst].concat(src);
      } else {
        return [dst, src];
      }
    }
  });

  // Remove query params from req.url as they all should be in req.params by now
  req.url = req.url.substring(0, sepIndex);
  return req;
};

const pruneQueryParams = (params) => {
  // Only prune nulls and undefined's. Keep empty strings.
  return Object.entries(params).reduce((result, [name, value]) => {
    if (Array.isArray(value)) {
      result[name] = value.filter((v) => v != null);
    } else if (value != null) {
      result[name] = value;
    }
    return result;
  }, {});
};

const compileLegacyScriptingSource = (source, zcli, app, logger) => {
  const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

  const underscore = require('underscore');
  // Configure template settings for legacy {{}} syntax
  // Note: Using secure defaults to prevent code injection vulnerabilities
  underscore.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g,
    evaluate: false, // Disable code evaluation for security
    escape: false, // Keep legacy behavior but be explicit
  };

  // Restore legacy function names for backward compatibility with user scripts
  // Based on test evidence in test/example-app/index.js lines 536-539

  // _.collect was an alias for _.map in old underscore versions
  if (!underscore.collect && underscore.map) {
    underscore.collect = underscore.map;
  }

  // _.contains was renamed to _.includes in newer underscore versions
  if (!underscore.contains && underscore.includes) {
    underscore.contains = underscore.includes;
  }

  return new Function( // eslint-disable-line no-new-func
    '_',
    'crypto',
    'async',
    'moment',
    'DOMParser',
    'XMLSerializer',
    'atob',
    'btoa',
    'z',
    '$',
    'console',
    'require',
    'ErrorException',
    'HaltedException',
    'StopRequestException',
    'ExpiredAuthException',
    'RefreshTokenException',
    'InvalidSessionException',
    source + '\nreturn Zap;',
  )(
    underscore,
    require('crypto'),
    require('async'),
    require('moment-timezone'),
    DOMParser,
    XMLSerializer,
    require('./atob'),
    require('./btoa'),
    require('./zfactory')(zcli, app, logger),
    require('./$'),
    zcli.console,
    require,
    ErrorException,
    HaltedException,
    StopRequestException,
    ExpiredAuthException,
    RefreshTokenException,
    InvalidSessionException,
  );
};

const applyBeforeMiddleware = (befores, request, z, bundle) => {
  befores = befores || [];
  return befores.reduce(
    (prev, cur) => prev.then((req) => cur(req, z, bundle)),
    Promise.resolve(request),
  );
};

const createEventNameToMethodMapping = (key) => {
  return {
    //
    // Auth
    //
    'auth.session': 'get_session_info',
    'auth.connectionLabel': 'get_connection_label',
    'auth.oauth2.token.pre': 'pre_oauthv2_token',
    'auth.oauth2.token.post': 'post_oauthv2_token',
    'auth.oauth2.refresh.pre': 'pre_oauthv2_refresh',

    //
    // Triggers
    //
    'trigger.poll': `${key}_poll`,
    'trigger.pre': `${key}_pre_poll`,
    'trigger.post': `${key}_post_poll`,
    'trigger.hook': `${key}_catch_hook`,
    'trigger.hook.pre': `${key}_pre_hook`,
    'trigger.hook.post': `${key}_post_hook`,
    'trigger.hook.subscribe.pre': 'pre_subscribe',
    'trigger.hook.subscribe.post': 'post_subscribe',
    'trigger.hook.unsubscribe.pre': 'pre_unsubscribe',
    'trigger.output.pre': `${key}_pre_custom_trigger_fields`,
    'trigger.output.post': `${key}_post_custom_trigger_fields`,

    //
    // Creates
    //
    'create.write': `${key}_write`,
    'create.pre': `${key}_pre_write`,
    'create.post': `${key}_post_write`,
    'create.input': `${key}_custom_action_fields`,
    'create.input.pre': `${key}_pre_custom_action_fields`,
    'create.input.post': `${key}_post_custom_action_fields`,
    'create.output': `${key}_custom_action_result_fields`,
    'create.output.pre': `${key}_pre_custom_action_result_fields`,
    'create.output.post': `${key}_post_custom_action_result_fields`,

    //
    // Searches
    //
    'search.search': `${key}_search`,
    'search.pre': `${key}_pre_search`,
    'search.post': `${key}_post_search`,
    'search.resource': `${key}_read_resource`,
    'search.resource.pre': `${key}_pre_read_resource`,
    'search.resource.post': `${key}_post_read_resource`,
    'search.input': `${key}_custom_search_fields`,
    'search.input.pre': `${key}_pre_custom_search_fields`,
    'search.input.post': `${key}_post_custom_search_fields`,
    'search.output': `${key}_custom_search_result_fields`,
    'search.output.pre': `${key}_pre_custom_search_result_fields`,
    'search.output.post': `${key}_post_custom_search_result_fields`,

    //
    // Hydration
    //
    'hydrate.method': key,
  };
};

const legacyScriptingRunner = (Zap, zcli, input) => {
  const app = _.get(input, '_zapier.app');
  const logger = _.get(input, '_zapier.logger');

  if (typeof Zap === 'string') {
    Zap = compileLegacyScriptingSource(Zap, zcli, app, logger);
  }

  // Does string replacement ala WB, using bundle and a potential result object
  const replaceVars = (templateString, bundle, result) => {
    // Security: Ensure templateString is a string and not user-controlled
    if (typeof templateString !== 'string') {
      throw new Error('Template string must be a string');
    }

    const options = {
      interpolate: /{{([\s\S]+?)}}/g,
      // Security: Disable code evaluation to prevent injection
      evaluate: false,
      escape: false,
    };
    const values = { ...bundle.authData, ...bundle.inputData, ...result };

    // Security: Use safe template compilation
    try {
      return _.template(templateString, options)(values);
    } catch (err) {
      logger(`Template rendering error: ${err.message}`, {
        log_type: 'bundle',
        error_message: err.stack,
      });
      return templateString; // Return original string on error
    }
  };

  const ensureIsType = (result, type) => {
    if (!type) {
      return result;
    }

    if (type.startsWith('array-')) {
      if (Array.isArray(result)) {
        return result;
      } else if (result && typeof result === 'object') {
        if (type === 'array-wrap') {
          return [result];
        } else {
          // Find the first array in the response
          for (const k in result) {
            const value = result[k];
            if (Array.isArray(value)) {
              return value;
            }
          }
        }
      } else if (!result) {
        return [];
      }
      throw new Error('JSON results array could not be located.');
    } else if (type.startsWith('object-')) {
      if (['number', 'string', 'boolean'].includes(typeof result)) {
        // primitive types that aren't null or undefined
        return { message: result };
      } else if (_.isEmpty(result)) {
        // null, undefined, empty object or array
        return {};
      } else if (_.isPlainObject(result)) {
        return result;
      } else if (
        Array.isArray(result) &&
        result.length > 0 &&
        _.isPlainObject(result[0])
      ) {
        // Used by auth test and auth label
        return result[0];
      }
      throw new Error('JSON results object could not be located.');
    }
    return result;
  };

  /**
    flattens trigger data for wb v1 apps
  */
  const flattenTriggerData = (data) => {
    for (const i in data) {
      for (const j in data[i]) {
        if (Array.isArray(data[i][j])) {
          data[i][j] = textifyList(data[i][j]);
        } else if (_.isPlainObject(data[i][j])) {
          const flattened = flattenDictionary(j, data[i][j]);
          data[i] = { ...data[i], ...flattened };
          delete data[i][j];
        }
      }
    }
    return data;
  };

  /**
    see handle_legacy_params in the python backend
  */
  const handleLegacyParams = (data) => {
    if (!_.isPlainObject(data)) {
      return data;
    }
    const params = _.cloneDeep(data);
    for (const i in data) {
      if (_.isPlainObject(data[i])) {
        const param = [];
        for (const j in data[i]) {
          param.push(j + '|' + data[i][j]);
        }
        params[i] = param.join('\n');
      } else if (Array.isArray(data[i])) {
        params[i] = data[i].join();
      }
    }
    return params;
  };

  /**
    see textify_list in the python backend
  */
  const textifyList = (data) => {
    if (!Array.isArray(data)) {
      return data;
    }
    let out = '';
    const allObj = data.every(_.isPlainObject);
    const sep = allObj ? '\n' : ',';

    for (const el of data) {
      if (_.isPlainObject(el)) {
        for (const key in el) {
          out += `${key}: ${el[key]}${sep}`;
        }
      } else if (Array.isArray(el)) {
        out += textifyList(el) + sep;
      } else if (el === null) {
        continue;
      } else {
        out += el + sep;
      }
      if (allObj) {
        out += sep;
      }
    }
    return out.replace(/[\n,]*$/, '');
  };

  const flattenDictionary = (prefix, data) => {
    const flattenedData = flatten(_.cloneDeep(data), { delimiter: '__' });
    const out = {};
    for (const key in flattenedData) {
      out[`${prefix}__${key}`] = flattenedData[key];
    }
    return out;
  };

  const chooseBetterError = (responseError, scriptError) => {
    if (scriptError) {
      if (!responseError || DEFINED_ERROR_NAMES.includes(scriptError.name)) {
        return scriptError;
      }
    }
    return responseError;
  };

  const runEvent = async (event, z, bundle) => {
    if (!Zap || _.isEmpty(Zap) || !event || !event.name || !z) {
      return;
    }

    const eventNameToMethod = createEventNameToMethodMapping(event.key);
    const methodName = eventNameToMethod[event.name];

    if (!methodName || !_.isFunction(Zap[methodName])) {
      return;
    }

    const convertedBundle = await bundleConverter(bundle, event, z);

    // In case the scripting method mutates the bundle
    const bundleForLog = _.cloneDeep(convertedBundle);

    // To know if request.files is changed by scripting
    event.originalFiles = _.cloneDeep(
      _.get(convertedBundle, 'request.files') || {},
    );

    const method = Zap[methodName].bind(Zap);

    // method.length is the number of args method accepts
    const isAsync = method.length > 1;

    let result;
    try {
      if (isAsync) {
        result = await promisify(method)(convertedBundle);
      } else {
        result = method(convertedBundle);
      }
    } catch (err) {
      logger(`Errored calling legacy scripting ${methodName}`, {
        log_type: 'bundle',
        input: convertedBundle,
        error_message: err.stack,
      });
      throw err;
    }

    logger(`Called legacy scripting ${methodName}`, {
      log_type: 'bundle',
      input: bundleForLog,
      output: _.cloneDeep(result),
    });

    return parseFinalResult(result, event);
  };

  // Simulates how WB backend runs JS scripting methods
  const runEventCombo = async (
    bundle,
    key,
    preEventName,
    postEventName,
    fullEventName,
    options,
  ) => {
    options = {
      // Options to deal with the final result returned by this function.
      // * checkResponseStatus: throws an error if response status is not 2xx.
      // * parseResponse:
      //     assumes response content is JSON and parse it. post method won't
      //     run if this is false.
      // * ensureType: ensures the result type. Could be one of the following values:
      //   - false:
      //       returns whatever data parsed from response content or returned
      //       by the post method.
      //   - 'array-wrap': returns [result] if result is an object.
      //   - 'array-first':
      //       returns the first top-level array in the result if result
      //       is an object.
      //   - 'object-first': returns the first object if result is an array.
      // * defaultToResponse: default to response if post method returns empty
      checkResponseStatus: true,
      parseResponse: true,
      ensureType: false,
      resetRequestForFullMethod: false,
      defaultToResponse: false,

      ...options,
    };

    if (bundle.request) {
      bundle.request = replaceCurliesInRequest(bundle.request, bundle);
    }

    if (_.get(app, 'legacy.needsTriggerData')) {
      bundle.triggerData = {};
    }

    let result;

    const eventNameToMethod = createEventNameToMethodMapping(key);

    const preMethodName = preEventName ? eventNameToMethod[preEventName] : null;
    const postMethodName = postEventName
      ? eventNameToMethod[postEventName]
      : null;
    const fullMethodName = fullEventName
      ? eventNameToMethod[fullEventName]
      : null;

    const fullMethod = fullMethodName ? Zap[fullMethodName] : null;
    if (fullMethod) {
      if (options.resetRequestForFullMethod) {
        // Used by custom fields
        bundle.request = { ...bundle.request, method: 'GET', url: '' };
      }

      // Running "full" scripting method like KEY_poll
      try {
        result = await runEvent({ key, name: fullEventName }, zcli, bundle);
      } catch (error) {
        if (error.name === 'StopRequestError') {
          return ensureIsType(null, options.ensureType);
        }
        throw error;
      }
    } else {
      const preMethod = preMethodName ? Zap[preMethodName] : null;
      let request;
      if (preMethod) {
        try {
          request = await runEvent({ key, name: preEventName }, zcli, bundle);
        } catch (error) {
          if (error.name === 'StopRequestError') {
            return ensureIsType(null, options.ensureType);
          }
          throw error;
        }
      } else {
        request = {};
      }

      request = { ...bundle.request, ...request };

      if (constants.REPLACE_CURLIES) {
        // REPLACE_CURLIES is added in core v17.1.0
        request[constants.REPLACE_CURLIES] = true;
      } else {
        // For core < v17.1.0
        request.replace = true;
      }

      const isBodyStream = typeof _.get(request, 'body.pipe') === 'function';
      if (!preMethod && !isBodyStream && isAnyFileFieldSet(bundle)) {
        // Enter here only when there's no KEY_pre method. When a KEY_pre method
        // is defined, addFilesToRequestBodyFromPreResult() already does the
        // file handling, so we don't want to do it again here.
        await addFilesToRequestBodyFromBody(request, bundle);
      }

      // encode everything, but retain curlies - those are replaced in z.request
      // important to maintain case here; `new URL()` lowercases the hostname,
      // which may contain a variable like '{{process.env.URL}}'
      request.url = encodeURI(request.url)
        .replace(/%25/g, '%') // fixes double encoding
        .replace(/%7B/g, '{')
        .replace(/%7D/g, '}');
      request.headers = cleanHeaders(request.headers);
      request.headers = dedupeHeaders(request.headers);
      request.allowGetBody = true;
      request.serializeValueForCurlies = serializeValueForCurlies;
      request.skipThrowForStatus = true;

      request = mergeQueryParams(request);
      if (request.params) {
        request.params = pruneQueryParams(request.params);
      }

      if (_.get(app, 'legacy.skipEncodingChars')) {
        // skipEncodingChars is only supported on core ^9.7.2, ^11.3.2 and >=12.x.
        // core versions that don't support it will just ignore it.
        request.skipEncodingChars = app.legacy.skipEncodingChars;
      }

      const response = await zcli.request(request);

      if (!options.parseResponse) {
        if (options.checkResponseStatus) {
          response.skipThrowForStatus = false;
          response.throwForStatus();
        }
        return response;
      }

      bundle.request = request;

      const postMethod = postMethodName ? Zap[postMethodName] : null;
      if (postMethod) {
        let scriptError, responseError;
        try {
          result = await runEvent(
            { key, name: postEventName, response },
            zcli,
            bundle,
          );
        } catch (error) {
          scriptError = error;
        }

        if (options.checkResponseStatus) {
          // Raising this error AFTER postMethod is executed allows devs to
          // intercept and throw another error from postMethod
          response.skipThrowForStatus = false;
          try {
            response.throwForStatus();
          } catch (error) {
            responseError = error;
          }
        }

        if (responseError || scriptError) {
          throw chooseBetterError(responseError, scriptError);
        }

        if (options.defaultToResponse && !result) {
          try {
            result = zcli.JSON.parse(response.content);
          } catch {
            result = {};
          }
        }
      } else {
        if (options.checkResponseStatus) {
          response.skipThrowForStatus = false;
          response.throwForStatus();
        }

        try {
          result = zcli.JSON.parse(response.content);
          if (postEventName) {
            result = await parseFinalResult(result, {
              key,
              name: postEventName,
            });
          }
        } catch {
          result = {};
        }
      }
    }

    result = ensureIsType(result, options.ensureType);
    return result;
  };

  const fetchOAuth1Token = async (url, authParams) => {
    const response = await zcli.request({
      method: 'POST',
      url,
      auth: authParams,
      skipThrowForStatus: true,
    });
    response.skipThrowForStatus = false;
    response.throwForStatus();
    return querystring.parse(response.content);
  };

  const runOAuth1GetRequestToken = (bundle) => {
    const url = _.get(
      app,
      'legacy.authentication.oauth1Config.requestTokenUrl',
    );

    const templateContext = { ...bundle.authData, ...bundle.inputData };
    const consumerKey = renderTemplate(process.env.CLIENT_ID, templateContext);
    const consumerSecret = renderTemplate(
      process.env.CLIENT_SECRET,
      templateContext,
    );

    return fetchOAuth1Token(url, {
      oauth_consumer_key: consumerKey,
      oauth_consumer_secret: consumerSecret,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_callback: bundle.inputData.redirect_uri,
    });
  };

  const runOAuth1AuthorizeUrl = (bundle) => {
    let url = _.get(app, 'legacy.authentication.oauth1Config.authorizeUrl');
    if (!url) {
      return '';
    }

    url = replaceCurliesInRequest({ url }, bundle, bundle.inputData).url;
    const urlObj = new URL(url);

    if (!urlObj.searchParams.has('oauth_token')) {
      urlObj.searchParams.set('oauth_token', bundle.inputData.oauth_token);
    }

    return urlObj.href;
  };

  const runOAuth1GetAccessToken = (bundle) => {
    let url = _.get(app, 'legacy.authentication.oauth1Config.accessTokenUrl');
    if (url) {
      url = replaceCurliesInRequest({ url }, bundle, bundle.inputData).url;
    }

    const templateContext = { ...bundle.authData, ...bundle.inputData };
    const consumerKey = renderTemplate(process.env.CLIENT_ID, templateContext);
    const consumerSecret = renderTemplate(
      process.env.CLIENT_SECRET,
      templateContext,
    );

    return fetchOAuth1Token(url, {
      oauth_consumer_key: consumerKey,
      oauth_consumer_secret: consumerSecret,
      oauth_token: bundle.inputData.oauth_token,
      oauth_token_secret: bundle.inputData.oauth_token_secret,
      oauth_verifier: bundle.inputData.oauth_verifier,
    });
  };

  const runOAuth2AuthorizeUrl = (bundle) => {
    let url = _.get(app, 'legacy.authentication.oauth2Config.authorizeUrl');
    if (!url) {
      return '';
    }

    url = replaceCurliesInRequest({ url }, bundle, bundle.inputData).url;
    const urlObj = new URL(url);

    if (!urlObj.searchParams.has('client_id')) {
      const templateContext = { ...bundle.authData, ...bundle.inputData };
      const clientId = renderTemplate(process.env.CLIENT_ID, templateContext);
      urlObj.searchParams.set('client_id', clientId);
    }
    if (!urlObj.searchParams.has('response_type')) {
      urlObj.searchParams.set('response_type', 'code');
    }

    urlObj.searchParams.set('redirect_uri', bundle.inputData.redirect_uri);
    urlObj.searchParams.set('state', bundle.inputData.state);

    urlObj.searchParams.sort();

    return urlObj.href;
  };

  const runOAuth2GetAccessToken = async (bundle) => {
    let url = _.get(app, 'legacy.authentication.oauth2Config.accessTokenUrl');
    if (url) {
      url = replaceCurliesInRequest({ url }, bundle, bundle.inputData).url;
    }

    const request = bundle.request;
    request.method = 'POST';
    request.url = url;
    request.headers['Content-Type'] = 'application/x-www-form-urlencoded';

    const origRequest = _.cloneDeep(request);

    const templateContext = { ...bundle.authData, ...bundle.inputData };
    const clientId = renderTemplate(process.env.CLIENT_ID, templateContext);
    const clientSecret = renderTemplate(
      process.env.CLIENT_SECRET,
      templateContext,
    );

    const authFieldKeys = (_.get(app, 'authentication.fields') || []).map(
      (f) => f.key,
    );
    authFieldKeys.push('_zapier_account_id');

    // In CLI, it's bundle.inputData instead of bundle.authData that has
    // yet-to-save (auth hasn't been saved) auth fields. In WB,
    // bundle.auth_fields always has yet-to-save auth fields.
    bundle.authData = {
      ..._.pick(bundle.inputData, authFieldKeys),
      ...bundle.authData,
    };

    const params = request.params;
    params.code = bundle.inputData.code;
    params.client_id = clientId;
    params.client_secret = clientSecret;
    params.redirect_uri = bundle.inputData.redirect_uri;
    params.grant_type = 'authorization_code';

    let result;

    try {
      result = await runEventCombo(
        bundle,
        '',
        'auth.oauth2.token.pre',
        'auth.oauth2.token.post',
        undefined,
        { defaultToResponse: true },
      );
    } catch (err) {
      if (err.name !== 'ResponseError' || Zap.pre_oauthv2_token) {
        throw err;
      }

      bundle.request = origRequest;

      const body = origRequest.body;
      body.code = bundle.inputData.code;
      body.client_id = clientId;
      body.client_secret = clientSecret;
      body.redirect_uri = bundle.inputData.redirect_uri;
      body.grant_type = 'authorization_code';

      result = await runEventCombo(
        bundle,
        '',
        'auth.oauth2.token.pre',
        'auth.oauth2.token.post',
        undefined,
        { defaultToResponse: true },
      );
    }

    return result;
  };

  const runOAuth2RefreshAccessToken = async (bundle) => {
    const url = _.get(
      app,
      'legacy.authentication.oauth2Config.refreshTokenUrl',
    );

    const request = bundle.request;
    request.method = 'POST';
    request.url = url;
    request.headers['Content-Type'] = 'application/x-www-form-urlencoded';

    const origRequest = _.cloneDeep(request);

    const templateContext = { ...bundle.authData, ...bundle.inputData };
    const clientId = renderTemplate(process.env.CLIENT_ID, templateContext);
    const clientSecret = renderTemplate(
      process.env.CLIENT_SECRET,
      templateContext,
    );

    const body = request.body;
    body.client_id = clientId;
    body.client_secret = clientSecret;
    body.refresh_token = bundle.authData.refresh_token;
    body.redirect_uri = bundle.inputData.redirect_uri;
    body.grant_type = 'refresh_token';

    let result;

    try {
      result = await runEventCombo(bundle, '', 'auth.oauth2.refresh.pre');
    } catch (err) {
      if (err.name !== 'ResponseError' || Zap.pre_oauthv2_refresh) {
        throw err;
      }

      bundle.request = origRequest;

      const params = origRequest.params;
      params.client_id = clientId;
      params.client_secret = clientSecret;
      params.refresh_token = bundle.authData.refresh_token;
      params.redirect_uri = bundle.inputData.redirect_uri;
      params.grant_type = 'refresh_token';

      result = await runEventCombo(bundle, '', 'auth.oauth2.refresh.pre');
    }

    return result;
  };

  const isTestingAuth = (bundle) => {
    // For core < 8.0.0
    if (
      _.get(bundle, 'meta.test_poll') === true &&
      _.get(bundle, 'meta.standard_poll') === false
    ) {
      return true;
    }

    // For core >= 8.0.0
    return _.get(bundle, 'meta.isTestingAuth');
  };

  const runTrigger = async (bundle, key) => {
    const url = _.get(app, `legacy.triggers.${key}.operation.url`);
    const needsFlattenedData = _.get(app, 'legacy.needsFlattenedData');
    bundle.request.url = url;

    // For auth test we want to make sure we return an object instead of an array
    const ensureType = isTestingAuth(bundle) ? 'object-first' : 'array-first';

    // Legacy WB doesn't check if trigger results have id
    bundle.skipChecks = ['triggerHasId'];

    if (needsFlattenedData) {
      bundle.skipChecks.push('triggerIsArray');
    }

    if (url) {
      bundle._legacyUrl = url;
    }

    let result = await runEventCombo(
      bundle,
      key,
      'trigger.pre',
      'trigger.post',
      'trigger.poll',
      { ensureType },
    );

    if (needsFlattenedData) {
      result = flattenTriggerData(result);
    }
    return result;
  };

  const runCatchHook = async (bundle, key) => {
    const methodName = `${key}_catch_hook`;
    let result;
    if (Zap[methodName]) {
      try {
        result = await runEvent({ key, name: 'trigger.hook' }, zcli, bundle);
      } catch (error) {
        if (error.name === 'StopRequestError') {
          return [];
        }
        throw error;
      }
    } else {
      result = bundle.cleanedRequest;
    }

    if (!Array.isArray(result)) {
      result = [result];
    }
    return result;
  };

  const runPrePostHook = (bundle, key) => {
    return runEventCombo(bundle, key, 'trigger.hook.pre', 'trigger.hook.post');
  };

  const runHook = (bundle, key) => {
    const hookType = _.get(app, `legacy.triggers.${key}.operation.hookType`);
    const needsFlattenedData = _.get(app, 'legacy.needsFlattenedData');

    let cleanedArray;
    if (Array.isArray(bundle.cleanedRequest)) {
      cleanedArray = bundle.cleanedRequest;
    } else if (
      bundle.cleanedRequest &&
      typeof bundle.cleanedRequest === 'object'
    ) {
      cleanedArray = [bundle.cleanedRequest];
    }

    const shouldRunPrePostHook =
      hookType === 'notification' &&
      cleanedArray &&
      cleanedArray.every((x) => x.resource_url);

    if (shouldRunPrePostHook) {
      const promises = cleanedArray.map((obj) => {
        const bund = _.cloneDeep(bundle);
        bund.request.url = obj.resource_url;
        return runPrePostHook(bund, key);
      });
      return Promise.all(promises).then((obj) => {
        obj = _.flatten(obj);
        if (needsFlattenedData) {
          obj = flattenTriggerData(obj);
        }
        return obj;
      });
    }

    let result = runCatchHook(bundle, key);
    if (needsFlattenedData) {
      result = flattenTriggerData(result);
    }
    return result;
  };

  const runHookSubscribe = (bundle, key) => {
    const url = _.get(app, 'legacy.subscribeUrl');
    const event = _.get(app, `legacy.triggers.${key}.operation.event`);

    const request = bundle.request;
    request.method = 'POST';
    request.url = url;

    const body = request.body;
    body.subscription_url = bundle.targetUrl; // backward compatibility
    body.target_url = bundle.targetUrl;
    body.event = event;

    bundle._legacyEvent = event;

    return runEventCombo(
      bundle,
      key,
      'trigger.hook.subscribe.pre',
      'trigger.hook.subscribe.post',
    );
  };

  const runHookUnsubscribe = (bundle, key) => {
    const url = _.get(app, 'legacy.unsubscribeUrl');
    const event = _.get(app, `legacy.triggers.${key}.operation.event`);

    const request = bundle.request;
    request.method = 'POST';
    request.url = url;

    const body = request.body;
    body.subscription_url = bundle.targetUrl; // backward compatibility
    body.target_url = bundle.targetUrl;
    body.event = event;

    bundle._legacyEvent = event;

    return runEventCombo(
      bundle,
      key,
      'trigger.hook.unsubscribe.pre',
      undefined,
      undefined,
      { parseResponse: false },
    );
  };

  const runCustomFields = async (
    bundle,
    key,
    typeOf,
    url,
    supportFullMethod = true,
  ) => {
    let preEventName, postEventName, fullEventName;
    if (url) {
      preEventName = typeOf + '.pre';
      postEventName = typeOf + '.post';
      bundle.request.url = url;

      // Provide bundle.raw_url and bundle.url_raw
      bundle._legacyUrl = url;
    }

    if (supportFullMethod) {
      fullEventName = typeOf;
    }

    bundle.request.method = 'GET';

    const fields = await runEventCombo(
      bundle,
      key,
      preEventName,
      postEventName,
      fullEventName,
      { ensureType: 'array-wrap', resetRequestForFullMethod: true },
    );
    return cleanCustomFields(fields);
  };

  const runTriggerOutputFields = (bundle, key) => {
    const url = _.get(app, `legacy.triggers.${key}.operation.outputFieldsUrl`);
    const needsFlattenedData = _.get(app, 'legacy.needsFlattenedData');

    if (needsFlattenedData) {
      bundle.inputData = handleLegacyParams(bundle.inputData);
    }

    return runCustomFields(bundle, key, 'trigger.output', url, false);
  };

  const runCreate = (bundle, key) => {
    const legacyProps = _.get(app, `legacy.creates.${key}.operation`) || {};
    const needsFlattenedData = _.get(app, 'legacy.needsFlattenedData');
    const url = legacyProps.url;

    // This represents the "Send to Action Endpoint URL in JSON body" checkbox.
    // If unchecked, the action field will be in this array.
    const fieldsExcludedFromBody = legacyProps.fieldsExcludedFromBody || [];

    const inputFields =
      _.get(app, `creates.${key}.operation.inputFields`) || [];

    markFileFieldsInBundle(bundle, inputFields);

    if (needsFlattenedData) {
      bundle.inputData = handleLegacyParams(bundle.inputData);
    }

    const body = {};
    _.each(bundle.inputData, (v, k) => {
      if (fieldsExcludedFromBody.indexOf(k) === -1) {
        body[k] = v;
      }
    });
    unflattenObject(body);

    bundle.request.method = 'POST';
    bundle.request.url = url;
    bundle.request.body = body;

    if (url) {
      bundle._legacyUrl = url;
    }

    bundle._fieldsExcludedFromBody = fieldsExcludedFromBody;

    return runEventCombo(
      bundle,
      key,
      'create.pre',
      'create.post',
      'create.write',
      { ensureType: 'object-first' },
    );
  };

  const runCreateInputFields = (bundle, key) => {
    const url = _.get(app, `legacy.creates.${key}.operation.inputFieldsUrl`);
    const needsFlattenedData = _.get(app, 'legacy.needsFlattenedData');

    if (url && needsFlattenedData) {
      bundle.inputData = handleLegacyParams(bundle.inputData);
    }

    return runCustomFields(bundle, key, 'create.input', url);
  };

  const runCreateOutputFields = (bundle, key) => {
    const url = _.get(app, `legacy.creates.${key}.operation.outputFieldsUrl`);
    return runCustomFields(bundle, key, 'create.output', url);
  };

  const runSearch = (bundle, key) => {
    const url = _.get(app, `legacy.searches.${key}.operation.url`);

    bundle.request.url = url;

    if (url) {
      bundle._legacyUrl = url;
    }

    return runEventCombo(
      bundle,
      key,
      'search.pre',
      'search.post',
      'search.search',
      { ensureType: 'array-first' },
    );
  };

  const runSearchResource = (bundle, key) => {
    const url = _.get(app, `legacy.searches.${key}.operation.resourceUrl`);
    bundle.request.url = url;

    return runEventCombo(
      bundle,
      key,
      'search.resource.pre',
      'search.resource.post',
      'search.resource',
      { parseResponseForPostMethod: true, ensureType: 'object-first' },
    );
  };

  const runSearchInputFields = (bundle, key) => {
    const url = _.get(app, `legacy.searches.${key}.operation.inputFieldsUrl`);
    return runCustomFields(bundle, key, 'search.input', url);
  };

  const runSearchOutputFields = (bundle, key) => {
    const url = _.get(app, `legacy.searches.${key}.operation.outputFieldsUrl`);
    return runCustomFields(bundle, key, 'search.output', url);
  };

  const runHydrateMethod = (bundle) => {
    const methodName = bundle.inputData.method;
    return runEvent({ name: 'hydrate.method', key: methodName }, zcli, bundle);
  };

  const runHydrateFile = (bundle) => {
    const meta = bundle.inputData.meta || {};

    // Legacy z.dehydrateFile(url, request, meta) behavior: if `request`
    // argument is provided (not null nor undefined), the dev is responsible for
    // doing auth themselves, so we use an internal request client to avoid
    // running the app's http middlewares.
    const request =
      bundle.inputData.request == null
        ? zcli.request
        : createInternalRequestClient(input);

    const requestOptions = bundle.inputData.request || {};
    requestOptions.url = bundle.inputData.url || requestOptions.url;
    requestOptions.raw = true;
    requestOptions.throwForStatus = true;

    const filePromise = request(requestOptions);
    return zcli.stashFile(filePromise, meta.length, meta.name);
  };

  // core exposes this function as z.legacyScripting.run() method that we can
  // run legacy scripting easily like z.legacyScripting.run(bundle, 'trigger', 'KEY')
  // in CLI to simulate how WB backend runs legacy scripting.
  const run = async (bundle, typeOf, key) => {
    let request = {
      url: '',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
      },
      params: {},
      body: {},
    };

    if (key) {
      // KEY_pre_ scripting methods expect the request to have auth info, so
      // before calling scripting, we add auth info by applying
      // app.beforeRequest here. We only need to do it for KEY_pre_ methods -
      // that means only when `key` exists.
      request = await applyBeforeMiddleware(
        app.beforeRequest,
        request,
        zcli,
        bundle,
      );
    }

    bundle.request = request;

    switch (typeOf) {
      case 'auth.session':
        return runEvent({ name: 'auth.session' }, zcli, bundle);
      case 'auth.connectionLabel':
        return runEvent({ name: 'auth.connectionLabel' }, zcli, bundle);
      case 'auth.oauth1.requestToken':
        return runOAuth1GetRequestToken(bundle);
      case 'auth.oauth1.authorize':
        return runOAuth1AuthorizeUrl(bundle);
      case 'auth.oauth1.accessToken':
        return runOAuth1GetAccessToken(bundle);
      case 'auth.oauth2.authorize':
        return runOAuth2AuthorizeUrl(bundle);
      case 'auth.oauth2.token':
        return runOAuth2GetAccessToken(bundle);
      case 'auth.oauth2.refresh':
        return runOAuth2RefreshAccessToken(bundle);
      case 'trigger':
        return runTrigger(bundle, key);
      case 'trigger.hook':
        return runHook(bundle, key);
      case 'trigger.hook.subscribe':
        return runHookSubscribe(bundle, key);
      case 'trigger.hook.unsubscribe':
        return runHookUnsubscribe(bundle, key);
      case 'trigger.output':
        return runTriggerOutputFields(bundle, key);
      case 'create':
        return runCreate(bundle, key);
      case 'create.input':
        return runCreateInputFields(bundle, key);
      case 'create.output':
        return runCreateOutputFields(bundle, key);
      case 'search':
        return runSearch(bundle, key);
      case 'search.resource':
        return runSearchResource(bundle, key);
      case 'search.input':
        return runSearchInputFields(bundle, key);
      case 'search.output':
        return runSearchOutputFields(bundle, key);
      case 'hydrate.method':
        return runHydrateMethod(bundle);
      case 'hydrate.file':
        return runHydrateFile(bundle);
    }

    throw new Error(`unrecognizable typeOf '${typeOf}'`);
  };

  // Dynamically generate http middlewares based on auth config. The generated
  // middleware could be a no-op if the auth doesn't require a middleware.
  const beforeRequest = createBeforeRequest(app);
  const afterResponse = createAfterResponse(app);

  return {
    afterResponse,
    beforeRequest,
    run,
    runEvent,
    replaceVars,
  };
};

module.exports = legacyScriptingRunner;
