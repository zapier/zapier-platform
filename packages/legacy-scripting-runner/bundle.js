const _ = require('lodash');

const { isFileField, hasFileFields, LazyFile } = require('./file');

// Max parts a key can have for unflattening
const MAX_KEY_PARTS = 6;

// Replace '{{bundle.inputData.abc}}' with '{{abc}}'
const undoCurlyReplacement = (str) =>
  str ? str.replace(/{{\s*bundle\.[^.]+\.([^}\s]+)\s*}}/g, '{{$1}}') : str;

// Unflatten from {key__child: value} to {key: {child: value}}
const unflattenObject = (data, separator = '__') => {
  if (Object(data) !== data || _.isArray(data)) {
    return data;
  }

  const keys = Object.keys(data);

  _.each(keys, (key) => {
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

const convertToQueryString = (object) => {
  if (!object) {
    return '';
  }

  const objectKeys = Object.keys(object);
  const queryStringItems = _.map(objectKeys, (key) => `${key}=${object[key]}`);

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
      client_secret: process.env.CLIENT_SECRET,
    };
    convertedBundle.load = _.get(bundle, 'request.body', {});
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
    Object.assign(convertedBundle, bundle.inputData.bundle);
  } else if (event.name.startsWith('auth.oauth2.token')) {
    // Overwrite convertedBundle.auth_fields with bundle.inputData
    convertedBundle.auth_fields = Object.keys(
      convertedBundle.auth_fields,
    ).reduce((result, k) => {
      result[k] = bundle.inputData[k] || convertedBundle.auth_fields[k];
      return result;
    }, {});
  }
};

const addHookData = (event, bundle, convertedBundle) => {
  if (event.name === 'trigger.hook') {
    convertedBundle.request = bundle.rawRequest || convertedBundle.request;
    convertedBundle.cleaned_request = bundle.cleanedRequest;

    if (!convertedBundle.request.querystring) {
      convertedBundle.request.querystring = convertToQueryString(
        bundle.inputData,
      );
    }
    if (!convertedBundle.request.content) {
      convertedBundle.request.content = convertedBundle.request.data || '';
    }
  } else if (event.name.startsWith('trigger.hook.subscribe')) {
    convertedBundle.target_url = bundle.targetUrl;
    convertedBundle.subscription_url = bundle.targetUrl;
    convertedBundle.event = bundle._legacyEvent;
    convertedBundle.trigger_data = bundle.inputData;
  } else if (event.name.startsWith('trigger.hook.unsubscribe')) {
    convertedBundle.target_url = bundle.targetUrl;
    convertedBundle.subscription_url = bundle.targetUrl;
    convertedBundle.subscribe_data = bundle.subscribeData;
    convertedBundle.event = bundle._legacyEvent;
    convertedBundle.trigger_data = bundle.inputData;
  }
};

const addRequestData = async (event, z, bundle, convertedBundle) => {
  Object.assign(
    convertedBundle.request.headers,
    _.get(bundle, 'request.headers'),
  );

  Object.assign(
    convertedBundle.request.params,
    _.get(bundle, 'request.params'),
  );

  const body = _.get(bundle, 'request.body');
  if (!_.isEmpty(body)) {
    let data = body;
    let files;

    if (typeof data !== 'string' && !event.name.startsWith('auth.oauth2')) {
      if (hasFileFields(bundle)) {
        // Exclude file fields from request.data
        data = Object.keys(body)
          .filter((k) => !isFileField(k, bundle))
          .reduce((result, k) => {
            result[k] = body[k];
            return result;
          }, {});

        const fileFieldKeys = Object.keys(body).filter((k) =>
          isFileField(k, bundle),
        );
        const fileMetas = await Promise.all(
          fileFieldKeys.map((k) => LazyFile(body[k]).meta()),
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
  } else if (event.name.startsWith('auth.oauth2.refresh.pre')) {
    // Make sure bundle.request.data is an object
    convertedBundle.request.data = convertedBundle.request.data || {};
  } else if (event.name.startsWith('create')) {
    if (
      !_.isEmpty(bundle._unflatInputData) ||
      (!event.name.includes('.input') && !event.name.includes('.output'))
    ) {
      // Only stringify an empty object when we aren't fetching custom fields
      convertedBundle.request.data = JSON.stringify(bundle._unflatInputData);
    }
  }
};

const addResponse = (event, bundle, convertedBundle) => {
  if (event.name.endsWith('.post')) {
    convertedBundle.response = { ...event.response };
    convertedBundle.response.status_code = convertedBundle.response.status;
    if (convertedBundle.response.request) {
      convertedBundle.response.request = {
        ...convertedBundle.response.request,
      };
      // `request.input` contains the entire app definition, which is big and
      // unnecessary for legacy scripting
      delete convertedBundle.response.request.input;
    }
  }
};

const convertBundleMeta = (meta) => {
  if (_.isEmpty(meta)) {
    return {};
  }

  const newMeta = {
    auth_test:
      meta.auth_test === undefined ? meta.isTestingAuth : meta.auth_test,
    frontend:
      meta.frontend === undefined ? meta.isLoadingSample : meta.frontend,
    prefill:
      meta.prefill === undefined ? meta.isFillingDynamicDropdown : meta.prefill,
    hydrate: true,
    test_poll:
      meta.test_poll === undefined ? meta.isTestingAuth : meta.test_poll,
    first_poll:
      meta.first_poll === undefined ? meta.isPopulatingDedupe : meta.first_poll,
    limit: meta.limit,
    page: meta.page,
    isBulkRead: meta.isBulkRead || false,
  };
  newMeta.standard_poll = !newMeta.test_poll;
  return newMeta;
};

// Convert bundle from CLI to WB based on which event to run
const bundleConverter = async (bundle, event, z) => {
  let requestMethod = _.get(bundle, 'request.method');
  if (!requestMethod) {
    if (
      event.name.startsWith('create') ||
      event.name.startsWith('auth.oauth2') ||
      event.name.startsWith('trigger.hook.subscribe')
    ) {
      requestMethod = 'POST';
    } else if (event.name === 'trigger.hook.unsubscribe.pre') {
      requestMethod = 'DELETE';
    } else {
      requestMethod = 'GET';
    }
  }

  // From inputData, remove keys that are in fieldsExcludedFromBody
  const excludedFieldKeys = bundle._fieldsExcludedFromBody || [];
  const filteredInputData = Object.keys(bundle.inputData || {})
    .filter((key) => !excludedFieldKeys.includes(key))
    .reduce((fields, key) => {
      return { [key]: bundle.inputData[key], ...fields };
    }, {});

  // Attach to bundle so we can reuse it
  bundle._unflatInputData = unflattenObject(filteredInputData);

  const meta = convertBundleMeta(bundle.meta);
  const zap = _.get(bundle, 'meta.zap') || { id: 0 };

  const convertedBundle = {
    request: {
      method: requestMethod,
      url: undoCurlyReplacement(_.get(bundle, 'request.url', '')),
      headers: {
        'Content-Type': 'application/json',
      },
      params: {},
      data: !requestMethod || requestMethod === 'GET' ? null : '',
    },
    auth_fields: _.get(bundle, 'authData', {}),
    meta,
    zap,
  };

  if (bundle._legacyUrl) {
    convertedBundle.raw_url = convertedBundle.url_raw = undoCurlyReplacement(
      bundle._legacyUrl,
    );
  }

  addAuthData(event, bundle, convertedBundle);
  addInputData(event, bundle, convertedBundle);
  await addRequestData(event, z, bundle, convertedBundle);
  addHookData(event, bundle, convertedBundle);
  addResponse(event, bundle, convertedBundle);

  return convertedBundle;
};

module.exports = {
  bundleConverter,
  unflattenObject,
};
