const _ = require('lodash');

const { isFileField, hasFileFields, LazyFile } = require('./file');

// Max parts a key can have for unflattening
const MAX_KEY_PARTS = 6;

// Unflatten from {key__child: value} to {key: {child: value}}
const unflattenObject = (data, separator = '__') => {
  if (Object(data) !== data || _.isArray(data)) {
    return data;
  }

  const keys = Object.keys(data);

  _.each(keys, key => {
    if (
      key.includes(separator) &&
      !key.startsWith(separator) &&
      !key.endsWith(separator)
    ) {
      const value = data[key];
      const keyParts = key.split(separator, MAX_KEY_PARTS);

      let i;
      let previousProp = data;
      let currentProp = data;

      for (i = 0; i < keyParts.length; i++) {
        currentProp[keyParts[i]] = currentProp[keyParts[i]] || {};
        previousProp = currentProp;
        currentProp = currentProp[keyParts[i]];
      }

      previousProp[keyParts[i - 1]] = value;

      delete data[key];
    }
  });

  return data;
};

const convertToQueryString = object => {
  if (!object) {
    return '';
  }

  const objectKeys = Object.keys(object);
  const queryStringItems = _.map(objectKeys, key => `${key}=${object[key]}`);

  return queryStringItems.join('&');
};

//
// Methods with logic for bundleConverter
//

const addAuthData = (event, bundle, convertedBundle) => {
  // Get authData only for basic auth here, to include in the request
  const { username, password } = _.get(bundle, 'authData', {});

  if (username && password) {
    convertedBundle.request.auth = [username, password];
  }

  // OAuth2 specific
  if (event.name.startsWith('auth.oauth2')) {
    convertedBundle.oauth_data = {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET
    };
    convertedBundle.load = _.get(bundle, 'inputData', {});
  }
};

const addInputData = (event, bundle, convertedBundle) => {
  if (event.name === 'auth.connectionLabel') {
    convertedBundle.test_result = bundle.inputData;
  } else if (event.name.startsWith('trigger.')) {
    convertedBundle.trigger_fields = bundle.inputData;
    convertedBundle.trigger_fields_raw =
      bundle.inputDataRaw || bundle.inputData;
  } else if (event.name.startsWith('create.')) {
    convertedBundle.action_fields = bundle._unflatInputData;
    convertedBundle.action_fields_full = bundle.inputData;
    convertedBundle.action_fields_raw = bundle.inputDataRaw || bundle.inputData;
  } else if (event.name.startsWith('search.')) {
    convertedBundle.search_fields = bundle.inputData;

    if (event.name.startsWith('search.resource')) {
      convertedBundle.read_fields = event.results || bundle.inputData;
      convertedBundle.read_context = bundle.inputData;
    }
  } else if (event.name === 'hydrate.method') {
    _.extend(convertedBundle, bundle.inputData.bundle);
  }
};

const addHookData = (event, bundle, convertedBundle) => {
  if (event.name === 'trigger.hook') {
    convertedBundle.request = bundle.rawRequest || convertedBundle.request;
    convertedBundle.cleaned_request = bundle.cleanedRequest;

    if (!convertedBundle.request.querystring) {
      convertedBundle.request.querystring = convertToQueryString(
        convertedBundle.request.params
      );
    }
    if (!convertedBundle.request.content) {
      convertedBundle.request.content = convertedBundle.request.data;
    }
  } else if (event.name.startsWith('trigger.hook.subscribe')) {
    convertedBundle.target_url = bundle.targetUrl;
    convertedBundle.event = bundle._legacyEvent;
  } else if (event.name.startsWith('trigger.hook.unsubscribe')) {
    if (event.name.endsWith('.pre')) {
      convertedBundle.request.method = 'DELETE';
    }
    convertedBundle.target_url = bundle.targetUrl;
    convertedBundle.subscribe_data = bundle.subscribeData;
    convertedBundle.event = bundle._legacyEvent;
  }
};

const addRequestData = async (event, z, bundle, convertedBundle) => {
  const headers = _.get(bundle, 'request.headers', {});
  _.extend(convertedBundle.request.headers, headers);

  const params = _.get(bundle, 'request.params', {});
  _.extend(convertedBundle.request.params, params);

  const body = _.get(bundle, 'request.body');
  if (body) {
    let data = body,
      files;

    if (typeof data !== 'string' && !event.name.startsWith('auth.oauth2')) {
      if (hasFileFields(bundle)) {
        // Exclude file fields from request.data
        data = Object.keys(body)
          .filter(k => !isFileField(k, bundle))
          .reduce((result, k) => {
            result[k] = body[k];
            return result;
          }, {});

        const fileFieldKeys = Object.keys(body).filter(k =>
          isFileField(k, bundle)
        );
        const fileMetas = await Promise.all(
          fileFieldKeys.map(k => LazyFile(body[k]).meta())
        );

        files = _.zip(fileFieldKeys, fileMetas)
          .map(([k, meta]) => {
            const urlOrContent = body[k];
            return [k, [meta.filename, urlOrContent, meta.contentType]];
          })
          .reduce((result, [k, file]) => {
            result[k] = file;
            return result;
          }, {});
      }

      data = JSON.stringify(data);
    }

    convertedBundle.request.data = data;

    if (!_.isEmpty(files)) {
      convertedBundle.request.files = files;
      delete convertedBundle.request.headers['Content-Type'];
    }
  } else if (event.name.startsWith('create')) {
    convertedBundle.request.data = JSON.stringify(bundle._unflatInputData);
  }
};

const addResponse = (event, bundle, convertedBundle) => {
  if (event.name.endsWith('.post')) {
    convertedBundle.response = event.response;
    convertedBundle.response.status_code = event.response.status;
  }
};

// Convert bundle from CLI to WB based on which event to run
const bundleConverter = async (bundle, event, z) => {
  let defaultMethod = 'GET';

  if (
    event.name.startsWith('create') ||
    event.name.startsWith('auth.oauth2') ||
    event.name.startsWith('trigger.hook.subscribe')
  ) {
    defaultMethod = 'POST';
  }

  // Attach to bundle so we can reuse it
  bundle._unflatInputData = unflattenObject(_.clone(bundle.inputData || {}));

  const meta = _.cloneDeep(_.get(bundle, 'meta')) || {};
  const zap = _.get(meta, 'zap') || { id: 0 };
  delete meta.zap;

  const convertedBundle = {
    request: {
      method: _.get(bundle, 'request.method') || defaultMethod,
      url: _.get(bundle, '_legacyUrl', '') || _.get(bundle, 'request.url', ''),
      headers: {
        'Content-Type': 'application/json'
      },
      params: event.name.startsWith('create')
        ? {}
        : _.get(bundle, 'inputData', {}),
      data: ''
    },
    auth_fields: _.get(bundle, 'authData', {}),
    meta,
    zap,
    url_raw: _.get(bundle, '_legacyUrl', '')
  };

  addAuthData(event, bundle, convertedBundle);
  addInputData(event, bundle, convertedBundle);
  addHookData(event, bundle, convertedBundle);
  await addRequestData(event, z, bundle, convertedBundle);
  addResponse(event, bundle, convertedBundle);

  return convertedBundle;
};

module.exports = {
  bundleConverter,
  unflattenObject
};
