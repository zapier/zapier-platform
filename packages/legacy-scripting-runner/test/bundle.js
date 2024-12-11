require('should');

const _ = require('lodash');

const { bundleConverter } = require('../bundle');

describe('bundleConverter', () => {
  const defaultBundle = {
    _legacyUrl: 'https://zapier.com',
    request: {
      url: 'https://zapier.com',
    },
    inputData: {
      user: 'Zapier',
    },
    authData: {
      apiKey: 'Zapier-API-Key',
    },
    meta: {
      auth_test: false,
      first_poll: false,
      frontend: false,
      prefill: false,
      test_poll: false,
      hydrate: true,
      standard_poll: true,
      page: 1,
      limit: 100,
      isBulkRead: false,
    },
  };

  const defaultHookBundle = {
    _legacyUrl: 'https://zapier.com',
    _legacyEvent: 'message',
    request: {
      url: 'https://zapier.com',
    },
    targetUrl: 'https://hooks.zapier.com/abc',
    inputData: {
      user: 'Zapier',
    },
    authData: {
      apiKey: 'Zapier-API-Key',
    },
    meta: {
      auth_test: false,
      first_poll: false,
      frontend: false,
      prefill: false,
      test_poll: false,
      hydrate: true,
      standard_poll: true,
      page: 1,
      limit: 100,
      isBulkRead: false,
    },
  };

  //
  // Triggers
  //

  it('should convert a bundle for _pre_poll, _poll, and _pre_custom_trigger_fields', async () => {
    const events = ['trigger.pre', 'trigger.poll', 'trigger.output.pre'];
    const bundle = defaultBundle;
    const expectedBundle = {
      request: {
        method: 'GET',
        url: 'https://zapier.com',
        headers: {
          'Content-Type': 'application/json',
        },
        params: {},
        data: null,
      },
      auth_fields: {
        apiKey: 'Zapier-API-Key',
      },
      meta: {
        auth_test: false,
        first_poll: false,
        frontend: false,
        prefill: false,
        test_poll: false,
        hydrate: true,
        standard_poll: true,
        page: 1,
        limit: 100,
        isBulkRead: false,
      },
      zap: { id: 0 },
      url_raw: 'https://zapier.com',
      raw_url: 'https://zapier.com',
      trigger_fields: {
        user: 'Zapier',
      },
      trigger_fields_raw: {
        user: 'Zapier',
      },
    };

    const results = await Promise.all(
      events.map((eventName) => {
        const event = {
          name: eventName,
          key: 'trigger',
        };
        return bundleConverter(bundle, event);
      }),
    );

    _.zip(events, results).forEach(([eventName, result]) => {
      result.should.eql(
        expectedBundle,
        `Expected bundle mismatch for "${eventName}".`,
      );
    });
  });

  it('should convert a bundle for _post_poll and _post_custom_trigger_fields', async () => {
    const events = ['trigger.post', 'trigger.output.post'];
    const eventData = {
      key: 'trigger',
      response: {
        status: 200,
        content: '[{"id": 1, "name": "Zapier"}]',
      },
    };
    const bundle = defaultBundle;
    const expectedBundle = {
      request: {
        method: 'GET',
        url: 'https://zapier.com',
        headers: {
          'Content-Type': 'application/json',
        },
        params: {},
        data: null,
      },
      auth_fields: {
        apiKey: 'Zapier-API-Key',
      },
      meta: {
        auth_test: false,
        first_poll: false,
        frontend: false,
        prefill: false,
        test_poll: false,
        hydrate: true,
        standard_poll: true,
        page: 1,
        limit: 100,
        isBulkRead: false,
      },
      zap: {
        id: 0,
      },
      url_raw: 'https://zapier.com',
      raw_url: 'https://zapier.com',
      trigger_fields: {
        user: 'Zapier',
      },
      trigger_fields_raw: {
        user: 'Zapier',
      },
      response: {
        status: 200,
        status_code: 200,
        content: '[{"id": 1, "name": "Zapier"}]',
      },
    };

    const results = await Promise.all(
      events.map((eventName) => {
        const event = _.cloneDeep(eventData);
        event.name = eventName;
        return bundleConverter(bundle, event);
      }),
    );

    _.zip(events, results).forEach(([eventName, result]) => {
      result.should.eql(
        expectedBundle,
        `Expected bundle mismatch for "${eventName}".`,
      );
    });
  });

  // Hooks
  it('should convert a bundle for _catch_hook', async () => {
    const event = {
      name: 'trigger.hook',
      key: 'hook',
    };
    const bundle = {
      _legacyUrl: 'https://zapier.com',
      request: { url: 'https://zapier.com' },
      inputData: {
        user: 'Zapier',
      },
      authData: {
        apiKey: 'Zapier-API-Key',
      },
      cleanedRequest: {
        id: 1,
        name: 'Zapier',
      },
    };
    const expectedBundle = {
      request: {
        method: 'GET',
        url: 'https://zapier.com',
        headers: {
          'Content-Type': 'application/json',
        },
        querystring: 'user=Zapier',
        params: {},
        data: null,
        content: '',
      },
      cleaned_request: {
        id: 1,
        name: 'Zapier',
      },
      meta: {},
      auth_fields: {
        apiKey: 'Zapier-API-Key',
      },
      zap: {
        id: 0,
      },
      url_raw: 'https://zapier.com',
      raw_url: 'https://zapier.com',
      trigger_fields: {
        user: 'Zapier',
      },
      trigger_fields_raw: {
        user: 'Zapier',
      },
    };

    const result = await bundleConverter(bundle, event);
    result.should.eql(
      expectedBundle,
      `Expected bundle mismatch for "${event.name}".`,
    );
  });

  it('should convert a bundle for pre_subscribe', async () => {
    const event = {
      name: 'trigger.hook.subscribe.pre',
    };
    const bundle = defaultHookBundle;
    const expectedBundle = {
      request: {
        method: 'POST',
        url: 'https://zapier.com',
        headers: {
          'Content-Type': 'application/json',
        },
        params: {},
        data: '',
      },
      meta: {
        auth_test: false,
        first_poll: false,
        frontend: false,
        prefill: false,
        test_poll: false,
        hydrate: true,
        standard_poll: true,
        page: 1,
        limit: 100,
        isBulkRead: false,
      },
      auth_fields: {
        apiKey: 'Zapier-API-Key',
      },
      zap: {
        id: 0,
      },
      url_raw: 'https://zapier.com',
      raw_url: 'https://zapier.com',
      trigger_fields: {
        user: 'Zapier',
      },
      trigger_data: {
        user: 'Zapier',
      },
      trigger_fields_raw: {
        user: 'Zapier',
      },
      target_url: 'https://hooks.zapier.com/abc',
      subscription_url: 'https://hooks.zapier.com/abc',
      event: 'message',
    };

    const result = await bundleConverter(bundle, event);
    result.should.eql(
      expectedBundle,
      `Expected bundle mismatch for "${event.name}".`,
    );
  });

  it('should convert a bundle for post_subscribe', async () => {
    const event = {
      name: 'trigger.hook.subscribe.post',
      response: {
        status: 200,
        content: '[{"id": 1, "name": "Zapier"}]',
      },
    };
    const bundle = defaultHookBundle;
    const expectedBundle = {
      request: {
        method: 'POST',
        url: 'https://zapier.com',
        headers: {
          'Content-Type': 'application/json',
        },
        params: {},
        data: '',
      },
      meta: {
        auth_test: false,
        first_poll: false,
        frontend: false,
        prefill: false,
        test_poll: false,
        hydrate: true,
        standard_poll: true,
        page: 1,
        limit: 100,
        isBulkRead: false,
      },
      auth_fields: {
        apiKey: 'Zapier-API-Key',
      },
      zap: {
        id: 0,
      },
      url_raw: 'https://zapier.com',
      raw_url: 'https://zapier.com',
      trigger_fields: {
        user: 'Zapier',
      },
      trigger_data: {
        user: 'Zapier',
      },
      trigger_fields_raw: {
        user: 'Zapier',
      },
      response: {
        status: 200,
        status_code: 200,
        content: '[{"id": 1, "name": "Zapier"}]',
      },
      target_url: 'https://hooks.zapier.com/abc',
      subscription_url: 'https://hooks.zapier.com/abc',
      event: 'message',
    };

    const result = await bundleConverter(bundle, event);
    result.should.eql(
      expectedBundle,
      `Expected bundle mismatch for "${event.name}".`,
    );
  });

  it('should convert a bundle for pre_unsubscribe', async () => {
    const event = {
      name: 'trigger.hook.unsubscribe.pre',
    };
    const bundle = {
      _legacyUrl: 'https://zapier.com',
      _legacyEvent: 'message',
      request: { url: 'https://zapier.com' },
      targetUrl: 'https://hooks.zapier.com/abc',
      inputData: {
        user: 'Zapier',
      },
      authData: {
        apiKey: 'Zapier-API-Key',
      },
      subscribeData: {
        id: 1,
      },
    };
    const expectedBundle = {
      request: {
        method: 'DELETE',
        url: 'https://zapier.com',
        headers: {
          'Content-Type': 'application/json',
        },
        params: {},
        data: '',
      },
      meta: {},
      auth_fields: {
        apiKey: 'Zapier-API-Key',
      },
      zap: {
        id: 0,
      },
      url_raw: 'https://zapier.com',
      raw_url: 'https://zapier.com',
      trigger_fields: {
        user: 'Zapier',
      },
      trigger_data: {
        user: 'Zapier',
      },
      trigger_fields_raw: {
        user: 'Zapier',
      },
      target_url: 'https://hooks.zapier.com/abc',
      subscription_url: 'https://hooks.zapier.com/abc',
      event: 'message',
      subscribe_data: {
        id: 1,
      },
    };

    const result = await bundleConverter(bundle, event);
    result.should.eql(
      expectedBundle,
      `Expected bundle mismatch for "${event.name}".`,
    );
  });

  it('should convert a bundle for _pre_hook', async () => {
    const event = {
      name: 'trigger.hook.pre',
      key: 'hook',
    };
    const bundle = defaultBundle;
    const expectedBundle = {
      request: {
        method: 'GET',
        url: 'https://zapier.com',
        headers: {
          'Content-Type': 'application/json',
        },
        params: {},
        data: null,
      },
      meta: {
        auth_test: false,
        first_poll: false,
        frontend: false,
        prefill: false,
        test_poll: false,
        hydrate: true,
        standard_poll: true,
        page: 1,
        limit: 100,
        isBulkRead: false,
      },
      auth_fields: {
        apiKey: 'Zapier-API-Key',
      },
      zap: {
        id: 0,
      },
      url_raw: 'https://zapier.com',
      raw_url: 'https://zapier.com',
      trigger_fields: {
        user: 'Zapier',
      },
      trigger_fields_raw: {
        user: 'Zapier',
      },
    };

    const result = await bundleConverter(bundle, event);
    result.should.eql(
      expectedBundle,
      `Expected bundle mismatch for "${event.name}".`,
    );
  });

  it('should convert a bundle for _post_hook', async () => {
    const event = {
      name: 'trigger.hook.post',
      response: {
        status: 200,
        content: '[{"id": 1, "name": "Zapier"}]',
      },
    };
    const bundle = defaultBundle;
    const expectedBundle = {
      request: {
        method: 'GET',
        url: 'https://zapier.com',
        headers: {
          'Content-Type': 'application/json',
        },
        params: {},
        data: null,
      },
      meta: {
        auth_test: false,
        first_poll: false,
        frontend: false,
        prefill: false,
        test_poll: false,
        hydrate: true,
        standard_poll: true,
        page: 1,
        limit: 100,
        isBulkRead: false,
      },
      auth_fields: {
        apiKey: 'Zapier-API-Key',
      },
      zap: {
        id: 0,
      },
      url_raw: 'https://zapier.com',
      raw_url: 'https://zapier.com',
      trigger_fields: {
        user: 'Zapier',
      },
      trigger_fields_raw: {
        user: 'Zapier',
      },
      response: {
        status: 200,
        status_code: 200,
        content: '[{"id": 1, "name": "Zapier"}]',
      },
    };

    const result = await bundleConverter(bundle, event);
    result.should.eql(
      expectedBundle,
      `Expected bundle mismatch for "${event.name}".`,
    );
  });

  //
  // Creates
  //

  it('should convert a bundle for _pre_write, _write, _custom_action_fields, _pre_custom_action_fields, and _pre_custom_action_result_fields', async () => {
    const events = [
      'create.pre',
      'create.write',
      'create.input',
      'create.input.pre',
      'create.output.pre',
    ];
    const bundle = defaultBundle;
    const expectedBundle = {
      request: {
        method: 'POST',
        url: 'https://zapier.com',
        headers: {
          'Content-Type': 'application/json',
        },
        params: {},
        data: '{"user":"Zapier"}',
      },
      auth_fields: {
        apiKey: 'Zapier-API-Key',
      },
      meta: {
        auth_test: false,
        first_poll: false,
        frontend: false,
        prefill: false,
        test_poll: false,
        hydrate: true,
        standard_poll: true,
        page: 1,
        limit: 100,
        isBulkRead: false,
      },
      zap: {
        id: 0,
      },
      url_raw: 'https://zapier.com',
      raw_url: 'https://zapier.com',
      action_fields: {
        user: 'Zapier',
      },
      action_fields_full: {
        user: 'Zapier',
      },
      action_fields_raw: {
        user: 'Zapier',
      },
    };

    const results = await Promise.all(
      events.map((eventName) => {
        const event = {
          name: eventName,
          key: 'create',
        };
        return bundleConverter(bundle, event);
      }),
    );

    _.zip(events, results).forEach(([eventName, result]) => {
      result.should.eql(
        expectedBundle,
        `Expected bundle mismatch for "${eventName}".`,
      );
    });
  });

  it('should convert a bundle for _post_write, _custom_action_result_fields, _post_custom_action_fields, and _post_custom_action_result_fields', async () => {
    const events = ['create.post', 'create.input.post', 'create.output.post'];
    const eventData = {
      key: 'create',
      response: {
        status: 200,
        content: '{"id": 1, "name": "Zapier"}',
      },
    };
    const bundle = defaultBundle;
    const expectedBundle = {
      request: {
        method: 'POST',
        url: 'https://zapier.com',
        headers: {
          'Content-Type': 'application/json',
        },
        params: {},
        data: '{"user":"Zapier"}',
      },
      auth_fields: {
        apiKey: 'Zapier-API-Key',
      },
      meta: {
        auth_test: false,
        first_poll: false,
        frontend: false,
        prefill: false,
        test_poll: false,
        hydrate: true,
        standard_poll: true,
        page: 1,
        limit: 100,
        isBulkRead: false,
      },
      zap: {
        id: 0,
      },
      url_raw: 'https://zapier.com',
      raw_url: 'https://zapier.com',
      action_fields: {
        user: 'Zapier',
      },
      action_fields_full: {
        user: 'Zapier',
      },
      action_fields_raw: {
        user: 'Zapier',
      },
      response: {
        status: 200,
        status_code: 200,
        content: '{"id": 1, "name": "Zapier"}',
      },
    };

    const results = await Promise.all(
      events.map((eventName) => {
        const event = _.cloneDeep(eventData);
        event.name = eventName;
        return bundleConverter(bundle, event);
      }),
    );

    _.zip(events, results).forEach(([eventName, result]) => {
      result.should.eql(
        expectedBundle,
        `Expected bundle mismatch for "${eventName}".`,
      );
    });
  });

  //
  // Searches
  //

  it('should convert a bundle for _pre_search, _search, _custom_search_fields, _pre_custom_search_fields, and _pre_custom_search_result_fields', async () => {
    const events = [
      'search.pre',
      'search.search',
      'search.input',
      'search.input.pre',
      'search.output.pre',
    ];
    const bundle = defaultBundle;
    const expectedBundle = {
      request: {
        method: 'GET',
        url: 'https://zapier.com',
        headers: {
          'Content-Type': 'application/json',
        },
        params: {},
        data: null,
      },
      auth_fields: {
        apiKey: 'Zapier-API-Key',
      },
      meta: {
        auth_test: false,
        first_poll: false,
        frontend: false,
        prefill: false,
        test_poll: false,
        hydrate: true,
        standard_poll: true,
        page: 1,
        limit: 100,
        isBulkRead: false,
      },
      zap: {
        id: 0,
      },
      url_raw: 'https://zapier.com',
      raw_url: 'https://zapier.com',
      search_fields: {
        user: 'Zapier',
      },
    };

    const results = await Promise.all(
      events.map((eventName) => {
        const event = {
          name: eventName,
          key: 'search',
        };
        return bundleConverter(bundle, event);
      }),
    );

    _.zip(events, results).forEach(([eventName, result]) => {
      result.should.eql(
        expectedBundle,
        `Expected bundle mismatch for "${eventName}".`,
      );
    });
  });

  it('should convert a bundle for _post_search, _custom_search_result_fields, _post_custom_search_fields, and _post_custom_search_result_fields', async () => {
    const events = ['search.post', 'search.input.post', 'search.output.post'];
    const eventData = {
      key: 'search',
      response: {
        status: 200,
        content: '[{"id": 1, "name": "Zapier"}]',
      },
    };
    const bundle = defaultBundle;
    const expectedBundle = {
      request: {
        method: 'GET',
        url: 'https://zapier.com',
        headers: {
          'Content-Type': 'application/json',
        },
        params: {},
        data: null,
      },
      auth_fields: {
        apiKey: 'Zapier-API-Key',
      },
      meta: {
        auth_test: false,
        first_poll: false,
        frontend: false,
        prefill: false,
        test_poll: false,
        hydrate: true,
        standard_poll: true,
        page: 1,
        limit: 100,
        isBulkRead: false,
      },
      zap: {
        id: 0,
      },
      url_raw: 'https://zapier.com',
      raw_url: 'https://zapier.com',
      search_fields: {
        user: 'Zapier',
      },
      response: {
        status: 200,
        status_code: 200,
        content: '[{"id": 1, "name": "Zapier"}]',
      },
    };

    const results = await Promise.all(
      events.map((eventName) => {
        const event = _.cloneDeep(eventData);
        event.name = eventName;
        return bundleConverter(bundle, event);
      }),
    );

    _.zip(events, results).forEach(([eventName, result]) => {
      result.should.eql(
        expectedBundle,
        `Expected bundle mismatch for "${eventName}".`,
      );
    });
  });

  it('should convert a bundle for _pre_read_resource and _read_resource', async () => {
    const events = ['search.resource.pre', 'search.resource'];
    const eventData = {
      key: 'search',
      results: [
        {
          id: 1,
          name: 'Zapier',
        },
      ],
    };
    const bundle = defaultBundle;
    const expectedBundle = {
      request: {
        method: 'GET',
        url: 'https://zapier.com',
        headers: {
          'Content-Type': 'application/json',
        },
        params: {},
        data: null,
      },
      auth_fields: {
        apiKey: 'Zapier-API-Key',
      },
      meta: {
        auth_test: false,
        first_poll: false,
        frontend: false,
        prefill: false,
        test_poll: false,
        hydrate: true,
        standard_poll: true,
        page: 1,
        limit: 100,
        isBulkRead: false,
      },
      zap: {
        id: 0,
      },
      url_raw: 'https://zapier.com',
      raw_url: 'https://zapier.com',
      search_fields: {
        user: 'Zapier',
      },
      read_context: {
        user: 'Zapier',
      },
      read_fields: [
        {
          id: 1,
          name: 'Zapier',
        },
      ],
    };

    const results = await Promise.all(
      events.map((eventName) => {
        const event = _.cloneDeep(eventData);
        event.name = eventName;
        return bundleConverter(bundle, event);
      }),
    );

    _.zip(events, results).forEach(([eventName, result]) => {
      result.should.eql(
        expectedBundle,
        `Expected bundle mismatch for "${eventName}".`,
      );
    });
  });

  it('should convert a bundle for _post_read_resource', async () => {
    const events = ['search.resource.post'];
    const eventData = {
      key: 'search',
      results: [
        {
          id: 1,
          name: 'Zapier',
        },
      ],
      response: {
        status: 200,
        content: '[{"id": 1, "name": "Zapier"}]',
      },
    };
    const bundle = defaultBundle;
    const expectedBundle = {
      request: {
        method: 'GET',
        url: 'https://zapier.com',
        headers: {
          'Content-Type': 'application/json',
        },
        params: {},
        data: null,
      },
      auth_fields: {
        apiKey: 'Zapier-API-Key',
      },
      meta: {
        auth_test: false,
        first_poll: false,
        frontend: false,
        prefill: false,
        test_poll: false,
        hydrate: true,
        standard_poll: true,
        page: 1,
        limit: 100,
        isBulkRead: false,
      },
      zap: {
        id: 0,
      },
      url_raw: 'https://zapier.com',
      raw_url: 'https://zapier.com',
      search_fields: {
        user: 'Zapier',
      },
      read_context: {
        user: 'Zapier',
      },
      read_fields: [
        {
          id: 1,
          name: 'Zapier',
        },
      ],
      response: {
        status: 200,
        status_code: 200,
        content: '[{"id": 1, "name": "Zapier"}]',
      },
    };

    const results = await Promise.all(
      events.map((eventName) => {
        const event = _.cloneDeep(eventData);
        event.name = eventName;
        return bundleConverter(bundle, event);
      }),
    );

    _.zip(events, results).forEach(([eventName, result]) => {
      result.should.eql(
        expectedBundle,
        `Expected bundle mismatch for "${eventName}".`,
      );
    });
  });

  //
  // Authentication
  //

  it('should convert a bundle for pre_oauthv2_token', async () => {
    const eventName = 'auth.oauth2.token.pre';
    const bundle = {
      _legacyUrl: 'https://zapier.com',
      request: { url: 'https://zapier.com' },
      inputData: {
        user: 'Zapier',
      },
      authData: {},
    };
    const expectedBundle = {
      request: {
        method: 'POST',
        url: 'https://zapier.com',
        headers: {
          'Content-Type': 'application/json',
        },
        params: {},
        data: '', // should be a string for pre_oauthv2_token
      },
      auth_fields: {},
      load: {},
      meta: {},
      zap: {
        id: 0,
      },
      url_raw: 'https://zapier.com',
      raw_url: 'https://zapier.com',
      oauth_data: {
        client_id: '1234',
        client_secret: 'asdf',
      },
    };

    const event = { name: eventName };
    const result = await bundleConverter(bundle, event);

    result.should.eql(expectedBundle);
  });

  it('should convert a bundle for pre_oauthv2_refresh', async () => {
    const eventName = 'auth.oauth2.refresh.pre';
    const bundle = {
      _legacyUrl: 'https://zapier.com',
      request: { url: 'https://zapier.com' },
      inputData: {
        user: 'Zapier',
      },
      authData: {},
    };
    const expectedBundle = {
      request: {
        method: 'POST',
        url: 'https://zapier.com',
        headers: {
          'Content-Type': 'application/json',
        },
        params: {},
        data: {},
      },
      auth_fields: {},
      load: {},
      meta: {},
      zap: {
        id: 0,
      },
      url_raw: 'https://zapier.com',
      raw_url: 'https://zapier.com',
      oauth_data: {
        client_id: '1234',
        client_secret: 'asdf',
      },
    };

    const event = { name: eventName };
    const result = await bundleConverter(bundle, event);

    result.should.eql(expectedBundle);
  });

  it('should convert a bundle for post_oauthv2_token', async () => {
    const events = ['auth.oauth2.token.post'];
    const eventData = {
      response: {
        status: 200,
        content: '[{"id": 1, "name": "Zapier"}]',
      },
    };
    const bundle = {
      _legacyUrl: 'https://zapier.com',
      request: { url: 'https://zapier.com' },
      inputData: {
        user: 'Zapier',
      },
      authData: {
        access_token: 'qwerty',
        refresh_token: 'zxcvb',
      },
    };
    const expectedBundle = {
      request: {
        method: 'POST',
        url: 'https://zapier.com',
        headers: {
          'Content-Type': 'application/json',
        },
        params: {},
        data: '',
      },
      auth_fields: {
        access_token: 'qwerty',
        refresh_token: 'zxcvb',
      },
      load: {},
      meta: {},
      zap: {
        id: 0,
      },
      url_raw: 'https://zapier.com',
      raw_url: 'https://zapier.com',
      oauth_data: {
        client_id: '1234',
        client_secret: 'asdf',
      },
      response: {
        status: 200,
        status_code: 200,
        content: '[{"id": 1, "name": "Zapier"}]',
      },
    };

    const results = await Promise.all(
      events.map((eventName) => {
        const event = _.cloneDeep(eventData);
        event.name = eventName;
        return bundleConverter(bundle, event);
      }),
    );

    _.zip(events, results).forEach(([eventName, result]) => {
      result.should.eql(
        expectedBundle,
        `Expected bundle mismatch for "${eventName}".`,
      );
    });
  });

  it('should convert a bundle for get_session_info', async () => {
    const events = ['auth.session'];
    const bundle = {
      _legacyUrl: 'https://zapier.com',
      request: { url: 'https://zapier.com' },
      inputData: {
        user: 'Zapier',
      },
      authData: {
        user: 'qwerty',
        pass: 'zxcvb',
      },
    };
    const expectedBundle = {
      request: {
        method: 'GET',
        url: 'https://zapier.com',
        headers: {
          'Content-Type': 'application/json',
        },
        params: {},
        data: null,
      },
      auth_fields: {
        user: 'qwerty',
        pass: 'zxcvb',
      },
      meta: {},
      zap: {
        id: 0,
      },
      url_raw: 'https://zapier.com',
      raw_url: 'https://zapier.com',
    };

    const results = await Promise.all(
      events.map((eventName) => {
        const event = {
          name: eventName,
        };
        return bundleConverter(bundle, event);
      }),
    );

    _.zip(events, results).forEach(([eventName, result]) => {
      result.should.eql(
        expectedBundle,
        `Expected bundle mismatch for "${eventName}".`,
      );
    });
  });

  it('should convert a bundle for get_connection_label', async () => {
    const events = ['auth.connectionLabel'];
    const bundle = {
      _legacyUrl: 'https://zapier.com',
      request: { url: 'https://zapier.com' },
      inputData: {
        user: 'Zapier',
      },
      authData: {
        email: 'contact@zapier.com',
      },
    };
    const expectedBundle = {
      request: {
        method: 'GET',
        url: 'https://zapier.com',
        headers: {
          'Content-Type': 'application/json',
        },
        params: {},
        data: null,
      },
      auth_fields: {
        email: 'contact@zapier.com',
      },
      meta: {},
      zap: {
        id: 0,
      },
      url_raw: 'https://zapier.com',
      raw_url: 'https://zapier.com',
      test_result: {
        user: 'Zapier',
      },
    };

    const results = await Promise.all(
      events.map((eventName) => {
        const event = {
          name: eventName,
        };
        return bundleConverter(bundle, event);
      }),
    );

    _.zip(events, results).forEach(([eventName, result]) => {
      result.should.eql(
        expectedBundle,
        `Expected bundle mismatch for "${eventName}".`,
      );
    });
  });
});
