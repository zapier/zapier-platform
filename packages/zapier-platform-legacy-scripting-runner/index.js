'use strict';

const _ = require('lodash');

const bundleConverter = require('./bundle');

const parseFinalResult = (result, event) => {
  // Old request was .data (string), new is .body (object), which matters for _pre
  if (event.name.endsWith('.pre')) {
    try {
      result.body = JSON.parse(result.data || '{}');
    } catch (e) {
      result.body = result.data;
    }
  }

  // Old writes accepted a list, but CLI doesn't anymore, which matters for _write and _post_write
  if (event.name === 'create.write' || event.name === 'create.post') {
    if (_.isArray(result) && result.length) {
      return result[0];
    } else if (!_.isArray(result)) {
      return result;
    }

    return {};
  }

  return result;
};

const compileLegacyScriptingSource = source => {
  const { DOMParser, XMLSerializer } = require('xmldom');
  const {
    ErrorException,
    HaltedException,
    StopRequestException,
    ExpiredAuthException,
    RefreshTokenException,
    InvalidSessionException
  } = require('./exceptions');

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
    'ErrorException',
    'HaltedException',
    'StopRequestException',
    'ExpiredAuthException',
    'RefreshTokenException',
    'InvalidSessionException',
    source + '\nreturn Zap;'
  )(
    _,
    require('crypto'),
    require('async'),
    require('moment-timezone'),
    DOMParser,
    XMLSerializer,
    require('./atob'),
    require('./btoa'),
    require('./z'),
    require('./$'),
    ErrorException,
    HaltedException,
    StopRequestException,
    ExpiredAuthException,
    RefreshTokenException,
    InvalidSessionException
  );
};

const applyBeforeMiddleware = (befores, request, z, bundle) => {
  befores = befores || [];
  return befores.reduce(
    (prev, cur) => prev.then(req => cur(req, z, bundle)),
    Promise.resolve(request)
  );
};

const createEventNameToMethodMapping = key => {
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
    'search.output.post': `${key}_post_custom_search_result_fields`
  };
};

const legacyScriptingRunner = (Zap, zobj, app) => {
  if (typeof Zap === 'string') {
    Zap = compileLegacyScriptingSource(Zap);
  }

  // Does string replacement ala WB, using bundle and a potential result object
  const replaceVars = (templateString, bundle, result) => {
    const options = {
      interpolate: /{{([\s\S]+?)}}/g
    };
    const values = _.extend({}, bundle.authData, bundle.inputData, result);
    return _.template(templateString, options)(values);
  };

  const runEvent = (event, z, bundle) =>
    new Promise((resolve, reject) => {
      if (!Zap || _.isEmpty(Zap) || !event || !event.name || !z) {
        return resolve();
      }

      const convertedBundle = bundleConverter(bundle, event);
      const eventNameToMethod = createEventNameToMethodMapping(event.key);
      const methodName = eventNameToMethod[event.name];

      if (methodName && _.isFunction(Zap[methodName])) {
        let result;

        try {
          // Handle async
          const optionalCallback = (error, asyncResult) => {
            if (error) {
              return reject(error);
            }
            return resolve(parseFinalResult(asyncResult, event));
          };

          result = Zap[methodName](convertedBundle, optionalCallback);

          // Handle sync
          if (typeof result !== 'undefined') {
            return resolve(parseFinalResult(result, event));
          }
        } catch (e) {
          return reject(e);
        }
      } else {
        return resolve({});
      }

      return undefined;
    });

  // Simulates how WB backend runs JS scripting methods
  const runEventCombo = (
    bundle,
    key,
    preEventName,
    postEventName,
    fullEventName,
    options
  ) => {
    options = _.extend(
      {
        // Options to deal with the final result returned by this function.
        // * checkResponseStatus: throws an error if response status is not 2xx.
        // * parseResponse:
        //     assumes response content is JSON and parse it. post method won't
        //     run if this is false.
        // * ensureArray: could be one of the following values:
        //   - false:
        //       returns whatever data parsed from response content or returned
        //       by the post method.
        //   - 'wrap': returns [result] if result is an object.
        //   - 'first':
        //       returns the first top-level array in the result if result
        //       is an object. This is the fallback behavior if ensureArray is
        //       not false nor 'wrap'.
        checkResponseStatus: true,
        parseResponse: true,
        ensureArray: false
      },
      options
    );

    let promise;

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
      // Running "full" scripting method like KEY_poll
      promise = runEvent({ key, name: fullEventName }, zobj, bundle);
    } else {
      const preMethod = preMethodName ? Zap[preMethodName] : null;
      if (preMethod) {
        promise = runEvent({ key, name: preEventName }, zobj, bundle);
      } else {
        promise = Promise.resolve(bundle.request);
      }

      promise = promise.then(request => zobj.request(request));

      if (options.checkResponseStatus) {
        promise = promise.then(response => {
          response.throwForStatus();
          return response;
        });
      }

      if (!options.parseResponse) {
        return promise;
      }

      const postMethod = postMethodName ? Zap[postMethodName] : null;
      if (postMethod) {
        promise = promise.then(response =>
          runEvent({ key, name: postEventName, response }, zobj, bundle)
        );
      } else {
        promise = promise.then(response => zobj.JSON.parse(response.content));
      }
    }

    if (options.ensureArray) {
      promise = promise.then(result => {
        if (Array.isArray(result)) {
          return result;
        } else if (result && typeof result === 'object') {
          if (options.ensureArray === 'wrap') {
            // Used by auth label and auth test
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
        }
        throw new Error('JSON results array could not be located.');
      });
    }

    return promise;
  };

  const runOAuth2GetAccessToken = bundle => {
    const url = _.get(
      app,
      'authentication.oauth2Config.legacyProperties.accessTokenUrl'
    );

    const request = bundle.request;
    request.method = 'POST';
    request.url = url;
    request.headers['Content-Type'] = 'application/json';

    const body = request.body;
    body.code = bundle.inputData.code;
    body.client_id = process.env.CLIENT_ID;
    body.client_secret = process.env.CLIENT_SECRET;
    body.redirect_uri = bundle.inputData.redirect_uri;
    body.grant_type = 'authorization_code';

    return runEventCombo(
      bundle,
      '',
      'auth.oauth2.token.pre',
      'auth.oauth2.token.post'
    );
  };

  const runOAuth2RefreshAccessToken = bundle => {
    const url = _.get(
      app,
      'authentication.oauth2Config.legacyProperties.refreshTokenUrl'
    );

    const request = bundle.request;
    request.method = 'POST';
    request.url = url;
    request.headers['Content-Type'] = 'application/json';

    const body = request.body;
    body.client_id = process.env.CLIENT_ID;
    body.client_secret = process.env.CLIENT_SECRET;
    body.refresh_token = bundle.authData.refresh_token;
    body.grant_type = 'refresh_token';

    return runEventCombo(bundle, '', 'auth.oauth2.refresh.pre');
  };

  const runTrigger = (bundle, key) => {
    const url = _.get(app, `triggers.${key}.operation.legacyProperties.url`);
    bundle.request.url = url;

    // For auth test we wrap the resposne as an array if it isn't one
    const ensureArray = _.get(bundle, 'meta.test_poll') ? 'wrap' : 'first';

    return runEventCombo(
      bundle,
      key,
      'trigger.pre',
      'trigger.post',
      'trigger.poll',
      { ensureArray }
    );
  };

  const runCatchHook = (bundle, key) => {
    const methodName = `${key}_catch_hook`;
    const promise = Zap[methodName]
      ? runEvent({ key, name: 'trigger.hook' }, zobj, bundle)
      : Promise.resolve(bundle.cleanedRequest);
    return promise.then(result => {
      if (!Array.isArray(result)) {
        result = [result];
      }
      return result;
    });
  };

  const runPrePostHook = (bundle, key) => {
    return runEventCombo(bundle, key, 'trigger.hook.pre', 'trigger.hook.post');
  };

  const runHook = (bundle, key) => {
    const hookType = _.get(
      app,
      `triggers.${key}.operation.legacyProperties.hookType`
    );

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
      cleanedArray.every(x => x.resource_url);

    if (shouldRunPrePostHook) {
      const promises = cleanedArray.map(obj => {
        const bund = _.cloneDeep(bundle);
        bund.request.url = obj.resource_url;
        return runPrePostHook(bund, key);
      });
      return Promise.all(promises).then(_.flatten);
    }

    return runCatchHook(bundle, key);
  };

  const runHookSubscribe = (bundle, key) => {
    const url = _.get(app, 'legacyProperties.subscribeUrl');
    const event = _.get(
      app,
      `triggers.${key}.operation.legacyProperties.event`
    );

    const request = bundle.request;
    request.method = 'POST';
    request.url = url;

    const body = request.body;
    body.subscription_url = bundle.targetUrl; // backward compatibility
    body.target_url = bundle.targetUrl;
    body.event = event;

    return runEventCombo(
      bundle,
      key,
      'trigger.hook.subscribe.pre',
      'trigger.hook.subscribe.post'
    );
  };

  const runHookUnsubscribe = (bundle, key) => {
    const url = _.get(app, 'legacyProperties.unsubscribeUrl');
    const event = _.get(
      app,
      `triggers.${key}.operation.legacyProperties.event`
    );

    const request = bundle.request;
    request.method = 'POST';
    request.url = url;

    const body = request.body;
    body.subscription_url = bundle.targetUrl; // backward compatibility
    body.target_url = bundle.targetUrl;
    body.event = event;

    return runEventCombo(
      bundle,
      key,
      'trigger.hook.unsubscribe.pre',
      undefined,
      undefined,
      { parseResponse: false }
    );
  };

  const runTriggerOutputFields = (bundle, key) => {
    const url = _.get(app, `triggers.${key}.operation.legacyProperties.outputFieldsUrl`);
    bundle.request.url = url;

    return runEventCombo(
      bundle,
      key,
      'trigger.output.pre',
      'trigger.output.post',
      undefined,
      { ensureArray: 'wrap' }
    );
  };

  // core exposes this function as z.legacyScripting.run() method that we can
  // run legacy scripting easily like z.legacyScripting.run(bundle, 'trigger', 'KEY')
  // in CLI to simulate how WB backend runs legacy scripting.
  const run = (bundle, typeOf, key) => {
    const initRequest = {
      headers: {},
      params: {},
      body: {}
    };
    return applyBeforeMiddleware(
      app.beforeRequest,
      initRequest,
      zobj,
      bundle
    ).then(preparedRequest => {
      bundle.request = preparedRequest;

      switch (typeOf) {
        case 'auth.session':
          return runEvent({ name: 'auth.session' }, zobj, bundle);
        case 'auth.connectionLabel':
          return runEvent({ name: 'auth.connectionLabel' }, zobj, bundle);
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

        // TODO: Add support for these:
        // create
        // create.input
        // create.output
        // search
        // search.resource
        // search.input
        // search.output
      }
      throw new Error(`unrecognizable typeOf '${typeOf}'`);
    });
  };

  return {
    run,
    runEvent,
    replaceVars
  };
};

module.exports = legacyScriptingRunner;
