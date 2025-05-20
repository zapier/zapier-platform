'use strict';

const nock = require('nock');
const should = require('should');
const createApp = require('../src/create-app');
const createInput = require('../src/tools/create-input');
const dataTools = require('../src/tools/data');
const errors = require('../src/errors');
const appDefinition = require('./userapp');
const { HTTPBIN_URL } = require('./constants');

describe('create-app', () => {
  const testLogger = (/* message, data */) => {
    // console.log(message, data);
    return Promise.resolve({});
  };

  const app = createApp(appDefinition);

  const createTestInput = (method, bundle) => {
    const event = {
      command: 'execute',
      bundle: { ...bundle },
      method,
      callback_url: 'calback_url',
    };

    return createInput(appDefinition, event, testLogger);
  };

  const createRawTestInput = (event) =>
    createInput(appDefinition, event, testLogger);

  it('should return data from promise', (done) => {
    const input = createTestInput(
      'resources.workingfuncpromise.list.operation.perform',
    );

    app(input)
      .then((output) => {
        output.results.should.eql([{ id: 3456 }]);
        done();
      })
      .catch(done);
  });

  it('should return data from promise (direct)', (done) => {
    const input = createTestInput(
      'triggers.workingfuncpromiseList.operation.perform',
    );

    app(input)
      .then((output) => {
        output.results.should.eql([{ id: 3456 }]);
        done();
      })
      .catch(done);
  });

  it('should return data from a sync function call', (done) => {
    const input = createTestInput('resources.list.list.operation.perform');

    app(input)
      .then((output) => {
        output.results.should.eql([{ id: 1234 }, { id: 5678 }]);
        done();
      })
      .catch(done);
  });

  it('should return data from a sync function call (direct)', (done) => {
    const input = createTestInput('triggers.listList.operation.perform');

    app(input)
      .then((output) => {
        output.results.should.eql([{ id: 1234 }, { id: 5678 }]);
        done();
      })
      .catch(done);
  });

  it('should return data from an async function call with callback', (done) => {
    const input = createTestInput(
      'resources.workingfuncasync.list.operation.perform',
    );

    app(input)
      .then((output) => {
        output.results.should.eql([{ id: 2345 }]);
        done();
      })
      .catch(done);
  });

  it('should return data from an async function call with callback (direct)', (done) => {
    const input = createTestInput(
      'triggers.workingfuncasyncList.operation.perform',
    );

    app(input)
      .then((output) => {
        output.results.should.eql([{ id: 2345 }]);
        done();
      })
      .catch(done);
  });

  it('should return data from live request call, applying HTTP before middleware', async () => {
    const input = createTestInput('resources.contact.list.operation.perform');
    const output = await app(input);

    const result = output.results[0];
    should.exist(result.headers);

    // verify that custom http before middleware was applied
    result.headers['X-Hashy'].should.deepEqual([
      '1a3ba5251cb33ee7ade01af6a7b960b8',
    ]);
    result.headers['X-Author'].should.deepEqual(['One Cool Dev']);
  });

  it('should fail on a live request call', async () => {
    const input = createTestInput(
      'resources.failerhttp.list.operation.perform',
    );

    try {
      await app(input);
    } catch (err) {
      should(err).instanceOf(errors.ResponseError);
      err.name.should.eql('ResponseError');

      const response = JSON.parse(err.message);
      response.status.should.eql(403);
      response.request.url.should.eql(`${HTTPBIN_URL}/status/403`);
      return;
    }

    throw new Error('expected an error');
  });

  it('should fail on a live request call (direct)', async () => {
    const input = createTestInput('triggers.failerhttpList.operation.perform');

    try {
      await app(input);
    } catch (err) {
      should(err).instanceOf(errors.ResponseError);
      err.name.should.eql('ResponseError');

      const response = JSON.parse(err.message);
      response.status.should.eql(403);
      response.request.url.should.eql(`${HTTPBIN_URL}/status/403`);
      return;
    }

    throw new Error('expected an error');
  });

  it('should make call via z.request with sugar url param', async () => {
    const input = createTestInput(
      'triggers.requestsugarList.operation.perform',
    );

    const output = await app(input);
    const result = output.results[0];

    result.headers['X-Hashy'].should.deepEqual([
      '1a3ba5251cb33ee7ade01af6a7b960b8',
    ]);
    result.headers['X-Author'].should.deepEqual(['One Cool Dev']);
  });

  it('should fail on a sync function', (done) => {
    const input = createTestInput(
      'resources.failerfunc.list.operation.perform',
    );

    app(input)
      .then(() => {
        done('expected an error');
      })
      .catch((err) => {
        should(err.message).startWith('Failer on sync function!');
        done();
      });
  });

  it('should fail on a sync function (direct)', (done) => {
    const input = createTestInput('triggers.failerfuncList.operation.perform');

    app(input)
      .then(() => {
        done('expected an error');
      })
      .catch((err) => {
        should(err.message).startWith('Failer on sync function!');
        done();
      });
  });

  it('should fail on promise function', (done) => {
    const input = createTestInput(
      'resources.failerfuncpromise.list.operation.perform',
    );

    app(input)
      .then(() => {
        done('expected an error');
      })
      .catch((err) => {
        should(err.message).startWith('Failer on promise function!');
        done();
      });
  });

  it('should fail on promise function (direct)', (done) => {
    const input = createTestInput(
      'triggers.failerfuncpromiseList.operation.perform',
    );

    app(input)
      .then(() => {
        done('expected an error');
      })
      .catch((err) => {
        should(err.message).startWith('Failer on promise function!');
        done();
      });
  });

  it('should apply HTTP after middleware', (done) => {
    const input = createTestInput(
      'resources.contacterror.listWithError.operation.perform',
    );

    app(input)
      .then(() => {
        done('expected an error, got success');
      })
      .catch((error) => {
        error.name.should.eql('Error');
        done();
      });
  });

  it('should return data from live request call (direct)', async () => {
    const input = createTestInput('triggers.contactList.operation.perform');
    const output = await app(input);

    const result = output.results[0];

    result.url.should.eql(`${HTTPBIN_URL}/get`);
    result.headers['X-Hashy'].should.deepEqual([
      '1a3ba5251cb33ee7ade01af6a7b960b8',
    ]);
    result.headers['X-Author'].should.deepEqual(['One Cool Dev']);
  });

  it('should return a rendered URL for OAuth2 authorizeURL', async () => {
    const oauth2AppDefinition = dataTools.jsonCopy(appDefinition);
    oauth2AppDefinition.authentication = {
      type: 'oauth2',
      test: {
        url: 'https://example.com',
        method: 'GET',
      },
      oauth2Config: {
        authorizeUrl: {
          url: 'https://{{bundle.authData.domain}}.example.com',
          params: {
            scope: '{{bundle.inputData.scope}}',
          },
        },
        getAccessToken: {
          url: 'https://example.com/oauth2/token',
          body: {},
          method: 'POST',
        },
        autoRefresh: false,
      },
    };
    const oauth2App = createApp(oauth2AppDefinition);
    const input = createTestInput('authentication.oauth2Config.authorizeUrl');
    input.bundle.authData = { domain: 'my-sub' };
    input.bundle.inputData = { scope: 'read,write' };

    const output = await oauth2App(input);
    output.results.should.eql('https://my-sub.example.com?scope=read%2Cwrite');
  });

  it('should run a raw provided request', async () => {
    const input = createRawTestInput({
      command: 'request',
      bundle: {
        request: {
          url: `${HTTPBIN_URL}/get`,
        },
      },
    });
    const output = await app(input);
    const response = output.results;
    JSON.parse(response.content).url.should.eql(`${HTTPBIN_URL}/get`);
  });

  it('should error on curlies for raw request', async () => {
    const input = createRawTestInput({
      command: 'request',
      bundle: {
        inputData: {
          lastname: 'Hamilton',
        },
        request: {
          url: `${HTTPBIN_URL}/post`,
          method: 'POST',
          params: {
            lastname: '{{bundle.inputData.lastname}}',
          },
        },
      },
    });
    await app(input).should.be.rejectedWith(
      /no longer supports \{\{bundle\.\*\}\}/,
    );
  });

  describe('output checks', () => {
    it('should check performBuffer output', async () => {
      const definition = dataTools.jsonCopy(appDefinition);
      definition.resources.row = {
        key: 'row',
        noun: 'Row',
        create: {
          display: {
            label: 'Insert Row',
          },
          operation: {
            performBuffer: (z, bundle) => {
              const firstId = bundle.buffer[0].meta.id;
              return { [firstId]: {} };
            },
          },
        },
      };
      const app = createApp(definition);
      const bundle = {
        buffer: [
          { meta: { id: 'ffee-0000' } },
          { meta: { id: 'ffee-0001' } },
          { meta: { id: 'ffee-0002' } },
          { meta: { id: 'ffee-0003' } },
          { meta: { id: 'ffee-0004' } },
          { meta: { id: 'ffee-0005' } },
        ],
      };
      const input = createTestInput(
        'creates.rowCreate.operation.performBuffer',
        bundle,
      );
      const err = await app(input).should.be.rejected();
      err.name.should.eql('CheckError');
      err.message.should.match(/missing these IDs as keys/);
      err.message.should.match(/ffee-0001, ffee-0002, ffee-0003, and 2 more/);
    });
  });

  describe('HTTP after middleware for auth refresh', () => {
    // general purpose response tester
    const testResponse = async (appDef, useShorthand, errorVerifier) => {
      const methodPart = useShorthand
        ? 'executeRequestAsShorthand'
        : 'executeRequestAsFunc';

      const app = createApp(appDef);
      const event = {
        command: 'execute',
        bundle: {
          inputData: useShorthand
            ? {
                url: `${HTTPBIN_URL}/status/401`,
              }
            : {
                options: {
                  url: `${HTTPBIN_URL}/status/401`,
                },
              },
        },
        method: `resources.${methodPart}.list.operation.perform`,
      };

      const input = createInput(appDef, event, testLogger);
      const err = await app(input).should.be.rejected();

      errorVerifier(err);
    };
    // the two types of error verification
    const verifyRefreshAuthError = (error) => {
      should(error).instanceOf(errors.RefreshAuthError);
      error.name.should.eql('RefreshAuthError');
    };

    const verifyResponseError = (error) => {
      should(error).instanceOf(errors.ResponseError);
      error.name.should.eql('ResponseError');
      const response = JSON.parse(error.message);
      should(response.status).equal(401);
    };

    it('should be applied to OAuth2 refresh app on shorthand requests', () => {
      return testResponse(
        {
          ...appDefinition,
          authentication: {
            type: 'oauth2',
            oauth2Config: {
              autoRefresh: true,
            },
          },
        },
        true,
        verifyRefreshAuthError,
      );
    });

    it('should be applied to OAuth2 refresh app on z.request in functions', () => {
      return testResponse(
        {
          ...appDefinition,
          authentication: {
            type: 'oauth2',
            oauth2Config: {
              autoRefresh: true,
            },
          },
        },
        false,
        verifyRefreshAuthError,
      );
    });

    it('should not be applied to OAuth2 refresh app on z.request in functions by default', () => {
      return testResponse(
        {
          ...appDefinition,
          authentication: {
            type: 'oauth2',
            oauth2Config: {
              autoRefresh: false,
            },
          },
        },
        false,
        verifyResponseError,
      );
    });

    it('should be applied to session auth app on z.request in functions', () => {
      return testResponse(
        {
          ...appDefinition,
          authentication: {
            type: 'session',
          },
        },
        false,
        verifyRefreshAuthError,
      );
    });

    it('should not be applied to custom auth app on z.request in functions', () => {
      return testResponse(
        {
          ...appDefinition,
          authentication: {
            type: 'custom',
          },
        },
        false,
        verifyResponseError,
      );
    });
  });

  describe('inputFields', () => {
    const testInputOutputFields = (desc, method) => {
      it(desc, (done) => {
        const input = createTestInput(method);
        input.bundle.key1 = 'key 1';
        input.bundle.key2 = 'key 2';
        input.bundle.key3 = 'key 3';

        app(input)
          .then((output) => {
            output.results.should.eql([
              { key: 'key 1' },
              { key: 'key 2' },
              { key: 'key 3' },
            ]);
            done();
          })
          .catch(done);
      });
    };

    testInputOutputFields(
      'should return static input fields',
      'triggers.staticinputfieldsList.operation.inputFields',
    );

    testInputOutputFields(
      'should return dynamic sync input fields',
      'triggers.dynamicsyncinputfieldsList.operation.inputFields',
    );

    testInputOutputFields(
      'should return dynamic async input fields',
      'triggers.dynamicasyncinputfieldsList.operation.inputFields',
    );

    testInputOutputFields(
      'should return mix of static, sync function and promise inputFields',
      'triggers.mixedinputfieldsList.operation.inputFields',
    );

    testInputOutputFields(
      'should return static output fields',
      'triggers.staticinputfieldsList.operation.outputFields',
    );

    testInputOutputFields(
      'should return dynamic sync output fields',
      'triggers.dynamicsyncinputfieldsList.operation.outputFields',
    );

    testInputOutputFields(
      'should return dynamic async output fields',
      'triggers.dynamicasyncinputfieldsList.operation.outputFields',
    );

    testInputOutputFields(
      'should return mix of static, sync function and promise outputFields',
      'triggers.mixedinputfieldsList.operation.outputFields',
    );
  });

  describe('hydration', () => {
    it('should hydrate method', async () => {
      const input = createTestInput(
        'resources.honkerdonker.list.operation.perform',
      );
      const output = await app(input);
      output.results.should.eql([
        {
          id: 1,
          $HOIST$:
            'hydrate|||{"type":"method","method":"resources.honkerdonker.get.operation.perform","bundle":{"honkerId":1}}|||hydrate',
        },
        {
          id: 2,
          $HOIST$:
            'hydrate|||{"type":"method","method":"resources.honkerdonker.get.operation.perform","bundle":{"honkerId":2}}|||hydrate',
        },
        {
          id: 3,
          $HOIST$:
            'hydrate|||{"type":"method","method":"resources.honkerdonker.get.operation.perform","bundle":{"honkerId":3}}|||hydrate',
        },
      ]);
    });
  });

  describe('calling a callback method', () => {
    let results;
    before(() =>
      app(
        createTestInput(
          'resources.executeCallbackRequest.create.operation.perform',
        ),
      ).then((output) => {
        results = output;
      }),
    );

    it('returns a CALLBACK envelope', () =>
      results.status.should.eql('CALLBACK'));

    it('returns the methods values', () =>
      results.results.should.eql({
        id: 'dontcare',
        callbackUrl: 'calback_url',
      }));
  });

  describe('using require', () => {
    const createDefinition = (source) => ({
      triggers: {
        testRequire: {
          display: {
            label: 'Test Require',
            description: 'Put zRequire through the ringer',
          },
          key: 'testRequire',
          operation: {
            perform: {
              source,
            },
          },
        },
      },
    });

    it('should throw a require error', async () => {
      const definition = createDefinition(`
        const crypto = require('crypto');
        return crypto.createHash('md5').update('abc').digest('hex');
      `);
      const input = createTestInput('triggers.testRequire.operation.perform');

      const appFail = createApp(definition);

      try {
        await appFail(input);
      } catch (error) {
        error.name.should.eql('RequireModuleError');
        error.message.should.eql(
          [
            'For technical reasons, use z.require() instead of require().',
            'What happened:',
            '  Executing triggers.testRequire.operation.perform with bundle',
            '  For technical reasons, use z.require() instead of require().',
          ].join('\n'),
        );
      }
    });

    it('should import and use the crypto module from node', async () => {
      const definition = createDefinition(`
        const crypto = z.require('crypto');
        return [{id: crypto.createHash('md5').update('abc').digest('hex')}];
      `);
      const input = createTestInput('triggers.testRequire.operation.perform');

      const appPass = createApp(definition);
      const { results } = await appPass(input);
      results[0].id.should.eql('900150983cd24fb0d6963f7d28e17f72');
    });

    it('should handle require errors', async () => {
      const definition = createDefinition(`
        const moment = z.require('non-existing-package');
        return moment(new Date).format('YYYY-MM-DD');
      `);

      const input = createTestInput('triggers.testRequire.operation.perform');

      const appFail = createApp(definition);

      await appFail(input).should.be.rejectedWith(
        /Cannot find module 'non-existing-package'/,
      );
    });

    it('should be able to import from other paths using zRequire', async () => {
      const input = createTestInput(
        'resources.listrequire.list.operation.perform',
      );
      const appPass = createApp(appDefinition);

      const { results } = await appPass(input);
      results.length.should.eql(1);
      results[0].url.should.eql('www.base-url.com');
    });
  });

  describe('response.content parsing', () => {
    it('should handle JSON', async () => {
      const app = createApp(appDefinition);

      const event = {
        command: 'execute',
        bundle: {
          inputData: {
            url: `${HTTPBIN_URL}/get`,
          },
        },
        method: 'resources.executeRequestAsShorthand.create.operation.perform',
      };
      const { results } = await app(
        createInput(appDefinition, event, testLogger),
      );
      should(results).be.an.Object().and.not.be.an.Array();
    });
    it('should handle form', async () => {
      const app = createApp(appDefinition);

      // httpbin doesn't actually have a form-urlencoded endpoint
      nock('https://x-www-form-urlencoded.example.com')
        .get('/')
        .reply(200, 'foo=bar', {
          'content-type': 'application/x-www-form-urlencoded',
        });

      const event = {
        command: 'execute',
        bundle: {
          inputData: {
            url: 'https://x-www-form-urlencoded.example.com/',
          },
        },
        method: 'resources.executeRequestAsShorthand.create.operation.perform',
      };
      const { results } = await app(
        createInput(appDefinition, event, testLogger),
      );
      should(results).match({ foo: 'bar' });
    });
    it('should error on other types like XML', async () => {
      const app = createApp(appDefinition);

      const event = {
        command: 'execute',
        bundle: {
          inputData: {
            url: `${HTTPBIN_URL}/xml`,
          },
        },
        method: 'resources.executeRequestAsShorthand.create.operation.perform',
      };
      await app(
        createInput(appDefinition, event, testLogger),
      ).should.be.rejectedWith(
        /Response needs to be JSON, form-urlencoded or parsed in middleware/,
      );
    });
  });

  describe('error skipping', () => {
    describe('shorthand requests', () => {
      const method =
        'resources.executeRequestAsShorthand.create.operation.perform';
      it('should throw on shorthand by default', async () => {
        const app = createApp(appDefinition);

        const event = {
          command: 'execute',
          bundle: {
            inputData: {
              url: `${HTTPBIN_URL}/status/400`,
            },
          },
          method,
        };
        const err = await app(
          createInput(appDefinition, event, testLogger),
        ).should.be.rejected();
        JSON.parse(err.message).status.should.eql(400);
      });

      it('should throw on shorthand even when global skip flag is present', async () => {
        const appDef = {
          ...appDefinition,
          flags: {
            // this is ignored for shorthand requests
            skipThrowForStatus: true,
          },
        };
        const app = createApp(appDef);

        const event = {
          command: 'execute',
          bundle: {
            inputData: {
              url: `${HTTPBIN_URL}/status/400`,
            },
          },
          method,
        };
        const err = await app(
          createInput(appDef, event, testLogger),
        ).should.be.rejected();
        JSON.parse(err.message).status.should.eql(400);
      });

      it('should skip throw on shorthand if local flag is set', async () => {
        const appDef = {
          ...appDefinition,
        };
        appDef.resources.executeRequestAsShorthand.create.operation.perform.skipThrowForStatus = true;

        const app = createApp(appDef);

        // httpbin can't return a body w/ the status endpoint
        const url = 'https://status-with-body.example.com';
        nock(url)
          .get('/')
          .reply(400, { status: 400, message: 'mocked response' });

        const event = {
          command: 'execute',
          bundle: { inputData: { url } },
          method,
        };
        const { results } = await app(
          createInput(appDef, event, testLogger),
        ).should.be.fulfilled();

        results.status.should.eql(400);
        results.message.should.eql('mocked response');
      });
    });

    describe('z.request requests', () => {
      const method = 'resources.executeRequestAsFunc.list.operation.perform';
      it('should throw on request by default', async () => {
        const app = createApp(appDefinition);

        const event = {
          command: 'execute',
          bundle: {
            inputData: {
              options: { url: `${HTTPBIN_URL}/status/400` },
            },
          },
          method,
        };
        const err = await app(
          createInput(appDefinition, event, testLogger),
        ).should.be.rejected();

        JSON.parse(err.message).status.should.eql(400);
      });

      it('should skip throw when global skip flag is present', async () => {
        const appDef = {
          ...appDefinition,
          flags: {
            skipThrowForStatus: true,
          },
        };
        // httpbin can't return a body w/ the status endpoint
        const url = 'https://status-with-body.example.com';
        nock(url)
          .get('/')
          .reply(400, [{ id: 1, status: 400, message: 'mocked response' }]);

        const app = createApp(appDef);
        const event = {
          command: 'execute',
          bundle: {
            inputData: { options: { url } },
          },
          method,
        };
        const { results } = await app(
          createInput(appDef, event, testLogger),
        ).should.be.fulfilled();

        results[0].status.should.eql(400);
        results[0].message.should.eql('mocked response');
      });

      it('should skip throw if local flag is set', async () => {
        const app = createApp(appDefinition);

        // httpbin can't return a body w/ the status endpoint
        const url = 'https://status-with-body.example.com';
        nock(url)
          .get('/')
          .reply(400, [{ id: 1, status: 400, message: 'mocked response' }]);

        const event = {
          command: 'execute',
          bundle: {
            inputData: { options: { url, skipThrowForStatus: true } },
          },
          method,
        };
        const { results } = await app(
          createInput(appDefinition, event, testLogger),
        ).should.be.fulfilled();

        results[0].status.should.eql(400);
        results[0].message.should.eql('mocked response');
      });

      it('should throw if local flag is false and global flag is set', async () => {
        const appDef = {
          ...appDefinition,
          flags: {
            skipThrowForStatus: true,
          },
        };
        const app = createApp(appDef);

        const event = {
          command: 'execute',
          bundle: {
            inputData: {
              options: {
                url: `${HTTPBIN_URL}/status/400`,
                skipThrowForStatus: false,
              },
            },
          },
          method,
        };
        const err = await app(
          createInput(appDefinition, event, testLogger),
        ).should.be.rejected();
        JSON.parse(err.message).status.should.eql(400);
      });
    });
  });
});
