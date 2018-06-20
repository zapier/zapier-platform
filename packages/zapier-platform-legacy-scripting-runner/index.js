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

const promiseChain = (initialPromise, callbacks) => {
  // Equivalent to initialPromise.then(callbacks[0]).then(callbacks[1])...
  return callbacks.reduce((prev, cur) => prev.then(cur), initialPromise);
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
    fullEventName
  ) => {
    let promise;
    const funcs = [];

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

      funcs.push(request => zobj.request(request));

      const postMethod = postMethodName ? Zap[postMethodName] : null;
      if (postMethod) {
        funcs.push(response => {
          response.throwForStatus();
          return runEvent({ key, name: postEventName, response }, zobj, bundle);
        });
      } else {
        funcs.push(response => {
          response.throwForStatus();
          return zobj.JSON.parse(response.content);
        });
      }
    }

    return promiseChain(promise, funcs);
  };

  const runOAuth2GetAccessToken = bundle => {
    const url = _.get(
      app,
      'authentication.oauth2Config.legacyProperties.accessTokenUrl'
    );
    bundle.request = {
      method: 'POST',
      url,
      body: {
        code: bundle.inputData.code,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uri: bundle.inputData.redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    };

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
    bundle.request = {
      method: 'POST',
      url,
      body: {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        refresh_token: bundle.authData.refresh_token,
        grant_type: 'refresh_token'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    };

    return runEventCombo(bundle, '', 'auth.oauth2.refresh.pre');
  };

  const runTrigger = (bundle, key) => {
    const url = _.get(app, `triggers.${key}.operation.legacyProperties.url`);
    bundle.request = { url };
    return runEventCombo(
      bundle,
      key,
      'trigger.pre',
      'trigger.post',
      'trigger.poll'
    );
  };

  // core exposes this function as z.legacyScripting.run() method that we can
  // run legacy scripting easily like z.legacyScripting.run(bundle, 'trigger', 'KEY')
  // in CLI to simulate how WB backend runs legacy scripting.
  const run = (bundle, typeOf, key) => {
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
    }

    // TODO: auth, create, and search
    return Promise.resolve();
  };

  return {
    run,
    runEvent,
    replaceVars
  };
};

module.exports = legacyScriptingRunner;
