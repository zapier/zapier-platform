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

const legacyScriptingRunner = (Zap) => ({
  runEvent: (event, z, bundle) => new Promise((resolve, reject) => {
    if (!Zap || _.isEmpty(Zap) || !event || !event.name || !z) {
      return resolve();
    }

    const convertedBundle = bundleConverter(bundle, event);

    const eventNameToMethod = {
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
      'trigger.poll': `${event.key}_poll`,
      'trigger.pre': `${event.key}_pre_poll`,
      'trigger.post': `${event.key}_post_poll`,
      'trigger.hook': `${event.key}_catch_hook`,
      'trigger.hook.pre': `${event.key}_pre_hook`,
      'trigger.hook.post': `${event.key}_post_hook`,
      'trigger.hook.subscribe.pre': `pre_subscribe`,
      'trigger.hook.subscribe.post': `post_subscribe`,
      'trigger.hook.unsubscribe.pre': `pre_unsubscribe`,
      'trigger.output.pre': `${event.key}_pre_custom_trigger_fields`,
      'trigger.output.post': `${event.key}_post_custom_trigger_fields`,

      //
      // Creates
      //
      'create.write': `${event.key}_write`,
      'create.pre': `${event.key}_pre_write`,
      'create.post': `${event.key}_post_write`,
      'create.input': `${event.key}_custom_action_fields`,
      'create.input.pre': `${event.key}_pre_custom_action_fields`,
      'create.input.post': `${event.key}_post_custom_action_fields`,
      'create.output': `${event.key}_custom_action_result_fields`,
      'create.output.pre': `${event.key}_pre_custom_action_result_fields`,
      'create.output.post': `${event.key}_post_custom_action_result_fields`,

      //
      // Searches
      //
      'search.search': `${event.key}_search`,
      'search.pre': `${event.key}_pre_search`,
      'search.post': `${event.key}_post_search`,
      'search.resource': `${event.key}_read_resource`,
      'search.resource.pre': `${event.key}_pre_read_resource`,
      'search.resource.post': `${event.key}_post_read_resource`,
      'search.input': `${event.key}_custom_search_fields`,
      'search.input.pre': `${event.key}_pre_custom_search_fields`,
      'search.input.post': `${event.key}_post_custom_search_fields`,
      'search.output': `${event.key}_custom_search_result_fields`,
      'search.output.pre': `${event.key}_pre_custom_search_result_fields`,
      'search.output.post': `${event.key}_post_custom_search_result_fields`,
    };

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
  }),

  // Does string replacement ala WB, using bundle and a potential result object
  replaceVars: (templateString, bundle, result) => {
    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    const values = _.extend({}, bundle.authData, bundle.inputData, result);
    return _.template(templateString)(values);
  },
});

module.exports = legacyScriptingRunner;
