'use strict';

const fs = require('fs');
const path = require('path');

const _ = require('lodash');
const should = require('should');

const createAppRequestClient = require('../src/tools/create-app-request-client');
const createInput = require('../src/tools/create-input');

describe('request client', () => {
  const testLogger = () => Promise.resolve({});
  const input = createInput({}, {}, testLogger);

  it('should include a user-agent header', done => {
    const request = createAppRequestClient(input);
    request({ url: 'https://httpbin.org/get' })
      .then(responseBefore => {
        const response = JSON.parse(JSON.stringify(responseBefore));

        response.request.headers['user-agent'].should.eql('Zapier');
        response.status.should.eql(200);

        const body = JSON.parse(response.content);
        body.url.should.eql('https://httpbin.org/get');
        done();
      })
      .catch(done);
  });

  it('should allow overriding the user-agent header', done => {
    const request = createAppRequestClient(input);
    request({
      url: 'https://httpbin.org/get',
      headers: {
        'User-Agent': 'Zapier!'
      }
    })
      .then(responseBefore => {
        const response = JSON.parse(JSON.stringify(responseBefore));

        should(response.request.headers['user-agent']).eql(undefined);
        response.request.headers['User-Agent'].should.eql('Zapier!');
        response.status.should.eql(200);

        const body = JSON.parse(response.content);
        body.url.should.eql('https://httpbin.org/get');
        done();
      })
      .catch(done);
  });

  it('should have json serializable response', done => {
    const request = createAppRequestClient(input);
    request({ url: 'https://httpbin.org/get' })
      .then(responseBefore => {
        const response = JSON.parse(JSON.stringify(responseBefore));

        response.headers['content-type'].should.eql('application/json');
        response.status.should.eql(200);

        const body = JSON.parse(response.content);
        body.url.should.eql('https://httpbin.org/get');
        done();
      })
      .catch(done);
  });

  it('should wrap a request entirely', done => {
    const request = createAppRequestClient(input);
    request({ url: 'https://httpbin.org/get' })
      .then(response => {
        response.status.should.eql(200);
        const body = JSON.parse(response.content);
        body.url.should.eql('https://httpbin.org/get');
        done();
      })
      .catch(done);
  });

  it('should support promise bodies', done => {
    const payload = { hello: 'world is nice' };
    const request = createAppRequestClient(input);
    request({
      method: 'POST',
      url: 'https://httpbin.org/post',
      body: Promise.resolve(payload)
    })
      .then(response => {
        response.status.should.eql(200);
        response.request.body.should.eql(JSON.stringify(payload));
        const body = JSON.parse(response.content);
        body.data.should.eql(JSON.stringify(payload));
        done();
      })
      .catch(done);
  });

  it('should support streaming another request', done => {
    const fileUrl =
      'https://s3.amazonaws.com/zapier-downloads/just-a-few-lines.txt';
    const fileExpectedContent =
      '0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n14\n15\n16\n17\n18\n19\n20\n21\n22\n23\n24\n25\n26\n27\n28\n29\n30\n';
    const request = createAppRequestClient(input);
    request({
      method: 'POST',
      url: 'http://zapier-mockbin.herokuapp.com/request', // httpbin doesn't handle chunked anything :-(
      body: request({ url: fileUrl, raw: true })
    })
      .then(response => {
        response.status.should.eql(200);
        const body = JSON.parse(response.content);
        body.postData.text.should.eql(fileExpectedContent);
        done();
      })
      .catch(done);
  });

  it('should handle a buffer upload fine', done => {
    const request = createAppRequestClient(input);
    request({
      method: 'POST',
      url: 'http://zapier-mockbin.herokuapp.com/request', // httpbin doesn't handle chunked anything :-(
      body: Buffer.from('hello world this is a cat (=^..^=)')
    })
      .then(response => {
        response.status.should.eql(200);
        const body = JSON.parse(response.content);
        body.postData.text.should.eql('hello world this is a cat (=^..^=)');
        done();
      })
      .catch(done);
  });

  it('should handle a stream upload fine', done => {
    const request = createAppRequestClient(input);
    request({
      method: 'POST',
      url: 'http://zapier-mockbin.herokuapp.com/request', // httpbin doesn't handle chunked anything :-(
      body: fs.createReadStream(path.join(__dirname, 'test.txt'))
    })
      .then(response => {
        response.status.should.eql(200);
        const body = JSON.parse(response.content);
        body.postData.text.should.eql('hello world this is a cat (=^..^=)');
        done();
      })
      .catch(done);
  });

  it('should support single url param', done => {
    const request = createAppRequestClient(input);
    request('https://httpbin.org/get')
      .then(response => {
        response.status.should.eql(200);
        const body = JSON.parse(response.content);
        body.url.should.eql('https://httpbin.org/get');
        done();
      })
      .catch(done);
  });

  it('should support url param with options', done => {
    const request = createAppRequestClient(input);
    request('https://httpbin.org/get', { headers: { A: 'B' } })
      .then(response => {
        response.status.should.eql(200);
        const body = JSON.parse(response.content);
        body.url.should.eql('https://httpbin.org/get');
        body.headers.A.should.eql('B');
        done();
      })
      .catch(done);
  });

  it('should support bytes', done => {
    const request = createAppRequestClient(input);
    request('https://httpbin.org/bytes/1024')
      .then(response => {
        response.status.should.eql(200);
        // it tries to decode the bytes /shrug
        response.content.length.should.belowOrEqual(1024);
        done();
      })
      .catch(done);
  });

  it('should support bytes raw', done => {
    const request = createAppRequestClient(input);
    request('https://httpbin.org/bytes/1024', { raw: true })
      .then(response => {
        response.status.should.eql(200);
        should(response.buffer).be.type('function');
        should(response.text).be.type('function');
        should(response.body.pipe).be.type('function');
        done();
      })
      .catch(done);
  });

  it('should support streaming bytes', done => {
    const request = createAppRequestClient(input);
    request('https://httpbin.org/stream-bytes/1024')
      .then(response => {
        response.status.should.eql(200);
        // it tries to decode the bytes /shrug
        response.content.length.should.belowOrEqual(1024);
        done();
      })
      .catch(done);
  });

  it('should support streaming bytes raw', done => {
    const request = createAppRequestClient(input);
    request('https://httpbin.org/stream-bytes/1024', {
      raw: true
    })
      .then(response => {
        response.status.should.eql(200);
        should(response.buffer).be.type('function');
        should(response.text).be.type('function');
        should(response.body.pipe).be.type('function');
        done();
      })
      .catch(done);
  });

  it('should support streaming bytes raw as buffer', done => {
    const request = createAppRequestClient(input);
    request('https://httpbin.org/stream-bytes/1024', {
      raw: true
    })
      .then(response => {
        response.status.should.eql(200);
        return response.buffer();
      })
      .then(buffer => {
        buffer.length.should.eql(1024);
        done();
      })
      .catch(done);
  });

  it('should run any beforeRequest functions', done => {
    const inputWithBeforeMiddleware = createInput(
      {
        beforeRequest: [
          request => {
            request.headers['X-Testing-True'] = 'Yes';
            return request;
          }
        ]
      },
      {},
      testLogger
    );
    const request = createAppRequestClient(inputWithBeforeMiddleware);
    request({ url: 'https://httpbin.org/get' })
      .then(responseBefore => {
        const response = JSON.parse(JSON.stringify(responseBefore));

        response.request.headers['X-Testing-True'].should.eql('Yes');
        response.status.should.eql(200);

        const body = JSON.parse(response.content);
        body.url.should.eql('https://httpbin.org/get');
        done();
      })
      .catch(done);
  });

  it('should run any afterResponse functions', done => {
    const inputWithAfterMiddleware = createInput(
      {
        afterResponse: [
          response => {
            response.json = { testing: true };
            return response;
          }
        ]
      },
      {},
      testLogger
    );
    const request = createAppRequestClient(inputWithAfterMiddleware);
    request({ url: 'https://httpbin.org/get' })
      .then(responseBefore => {
        const response = JSON.parse(JSON.stringify(responseBefore));

        response.json.testing.should.eql(true);
        response.status.should.eql(200);

        const body = JSON.parse(response.content);
        body.url.should.eql('https://httpbin.org/get');
        done();
      })
      .catch(done);
  });

  it('should parse form type request body', done => {
    const request = createAppRequestClient(input);
    request({
      url: 'https://httpbin.org/post',
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: {
        name: 'Something Else',
        directions: '!!No Way José'
      }
    })
      .then(response => {
        response.status.should.eql(200);
        response.request.body.should.eql(
          'name=Something+Else&directions=!!No+Way+Jos%C3%A9'
        );
        const body = JSON.parse(response.content);
        body.form.name.should.eql('Something Else');
        body.form.directions.should.eql('!!No Way José');
        done();
      })
      .catch(done);
  });

  it('should not parse form type request body when string', done => {
    const request = createAppRequestClient(input);
    request({
      url: 'https://httpbin.org/post',
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: 'name=Something Else&directions=!!No Way José'
    })
      .then(response => {
        response.status.should.eql(200);
        response.request.body.should.eql(
          'name=Something Else&directions=!!No Way José'
        );
        const body = JSON.parse(response.content);
        body.form.name.should.eql('Something Else');
        body.form.directions.should.eql('!!No Way José');
        done();
      })
      .catch(done);
  });

  it('should block self-signed SSL certificate', () => {
    const request = createAppRequestClient(input);
    return request('https://self-signed.badssl.com').should.be.rejectedWith({
      name: 'FetchError'
    });
  });

  it('should allow to disable SSL certificate check', () => {
    const newInput = _.cloneDeep(input);
    newInput._zapier.event.verifySSL = false;
    const request = createAppRequestClient(newInput);
    return request('https://self-signed.badssl.com').then(response => {
      response.status.should.eql(200);
    });
  });

  it('should allow unencrypted requests when SSL checks are disabled', () => {
    const newInput = _.cloneDeep(input);
    newInput._zapier.event.verifySSL = false;
    const request = createAppRequestClient(newInput);
    return request('https://httpbin.org/get').then(response => {
      response.status.should.eql(200);
    });
  });

  describe('adds query params', () => {
    it('should replace remaining curly params with empty string by default', () => {
      const request = createAppRequestClient(input);
      return request({
        url: 'https://httpbin.org/get',
        params: {
          something: '',
          really: '{{bundle.inputData.really}}',
          cool: 'true'
        }
      }).then(responseBefore => {
        const response = JSON.parse(JSON.stringify(responseBefore));

        response.json.args.something.should.eql('');
        response.json.args.really.should.eql('');
        response.json.args.cool.should.eql('true');
        response.status.should.eql(200);

        const body = JSON.parse(response.content);
        body.url.should.eql(
          'https://httpbin.org/get?something=&really=&cool=true'
        );
      });
    });

    it('should replace remaining curly params with empty string when set as false', () => {
      const request = createAppRequestClient(input);
      return request({
        url: 'https://httpbin.org/get',
        params: {
          something: '',
          really: '{{bundle.inputData.really}}',
          cool: 'true'
        },
        removeMissingValuesFrom: {
          params: false
        }
      }).then(responseBefore => {
        const response = JSON.parse(JSON.stringify(responseBefore));

        response.json.args.something.should.eql('');
        response.json.args.really.should.eql('');
        response.json.args.cool.should.eql('true');
        response.status.should.eql(200);

        const body = JSON.parse(response.content);
        body.url.should.eql(
          'https://httpbin.org/get?something=&really=&cool=true'
        );
      });
    });

    it('should omit empty params when set as true', () => {
      const event = {
        bundle: {
          inputData: {
            name: 'zapier'
          }
        }
      };
      const request = createAppRequestClient(
        createInput({}, event, testLogger)
      );

      return request({
        url: 'https://httpbin.org/get',
        params: {
          something: '',
          really: '{{bundle.inputData.really}}',
          cool: 'false',
          name: '{{bundle.inputData.name}}',
          foo: null,
          bar: undefined,
          zzz: '[]',
          yyy: '{}',
          qqq: ' '
        },
        removeMissingValuesFrom: {
          params: true
        }
      }).then(responseBefore => {
        const response = JSON.parse(JSON.stringify(responseBefore));

        should(response.json.args.something).eql(undefined);
        should(response.json.args.foo).eql(undefined);
        should(response.json.args.bar).eql(undefined);
        should(response.json.args.empty).eql(undefined);
        should(response.json.args.really).eql(undefined);
        response.json.args.cool.should.eql('false');
        response.json.args.zzz.should.eql('[]');
        response.json.args.yyy.should.eql('{}');
        response.json.args.qqq.should.eql(' ');
        response.json.args.name.should.eql('zapier');
        response.status.should.eql(200);

        const body = JSON.parse(response.content);
        body.url.should.eql(
          'https://httpbin.org/get?cool=false&name=zapier&zzz=[]&yyy={}&qqq= '
        );
      });
    });

    it('should not include ? if there are no params after cleaning', () => {
      const request = createAppRequestClient(input);
      return request({
        url: 'https://httpbin.org/get',
        params: {
          something: '',
          cool: ''
        },
        removeMissingValuesFrom: {
          params: true
        }
      }).then(responseBefore => {
        const response = JSON.parse(JSON.stringify(responseBefore));

        should(response.json.args.something).eql(undefined);
        should(response.json.args.cool).eql(undefined);
        response.status.should.eql(200);

        const body = JSON.parse(response.content);
        body.url.should.eql('https://httpbin.org/get');
      });
    });
  });

  describe('shorthand hook subscriptions', () => {
    it('should resolve bundle tokens in performSubscribe', () => {
      const targetUrl = 'https://zapier.com/hooks';
      const event = {
        bundle: {
          targetUrl,
          meta: {
            zap: { id: 987 }
          }
        }
      };
      const subscribeInput = createInput({}, event, testLogger);
      const request = createAppRequestClient(subscribeInput);
      return request({
        url: 'https://httpbin.org/post',
        method: 'POST',
        body: {
          hookUrl: '{{bundle.targetUrl}}',
          zapId: '{{bundle.meta.zap.id}}'
        }
      }).then(response => {
        const { hookUrl, zapId } = JSON.parse(response.json.data);

        hookUrl.should.eql(targetUrl);
        zapId.should.eql(987);
      });
    });

    it('should resolve bundle tokens in performUnubscribe', () => {
      const subscribeData = { id: 123 };
      const event = {
        bundle: { subscribeData }
      };
      const subscribeInput = createInput({}, event, testLogger);
      const request = createAppRequestClient(subscribeInput);
      return request({
        url: 'https://httpbin.org/delete',
        method: 'DELETE',
        params: {
          id: '{{bundle.subscribeData.id}}'
        }
      }).then(response => {
        const { url } = JSON.parse(response.content);

        response.json.args.id.should.eql('123');
        url.should.eql('https://httpbin.org/delete?id=123');
      });
    });
  });

  describe('resolves curlies', () => {
    it('should keep valid data types', () => {
      const event = {
        bundle: {
          inputData: {
            number: 123,
            bool: true,
            float: 123.456,
            arr: [1, 2, 3]
          }
        }
      };
      const bodyInput = createInput({}, event, testLogger);
      const request = createAppRequestClient(bodyInput);
      return request({
        url: 'https://httpbin.org/post',
        method: 'POST',
        body: {
          number: '{{bundle.inputData.number}}',
          bool: '{{bundle.inputData.bool}}',
          float: '{{bundle.inputData.float}}',
          arr: '{{bundle.inputData.arr}}'
        }
      }).then(response => {
        const { json } = response.json;

        should(json.empty).eql(undefined);
        json.number.should.eql(123);
        json.bool.should.eql(true);
        json.float.should.eql(123.456);
        json.arr.should.eql([1, 2, 3]);
      });
    });

    it('should keep valid data types that are hard-coded', () => {
      // This may seem like an usual case to be in, and for most apps it is.
      // However, converted apps that rely on legacy-scripting-runner can have
      // request bodies that are pure data, no {{}}, so we need to be sure to preserve those to
      const event = {
        bundle: {
          inputData: {
            number: 123,
            bool: true,
            float: 123.456,
            arr: [1, 2, 3],
            nested: { very: 'cool' }
          }
        }
      };
      const bodyInput = createInput({}, event, testLogger);
      const request = createAppRequestClient(bodyInput);
      return request({
        url: 'https://httpbin.org/post',
        method: 'POST',
        body: {
          number: 123,
          bool: true,
          float: 123.456,
          arr: [1, 2, 3]
        }
      }).then(response => {
        const { json } = response.json;

        should(json.empty).eql(undefined);
        json.number.should.eql(123);
        json.bool.should.eql(true);
        json.float.should.eql(123.456);
        json.arr.should.eql([1, 2, 3]);
      });
    });

    it('should remove keys from body for empty values if configured to', () => {
      const event = {
        bundle: {
          inputData: {
            name: 'Burgundy'
          }
        }
      };
      const bodyInput = createInput({}, event, testLogger);
      const request = createAppRequestClient(bodyInput);
      return request({
        url: 'https://httpbin.org/post',
        method: 'POST',
        body: {
          name: '{{bundle.inputData.name}}',
          empty: '{{bundle.inputData.empty}}'
        },
        removeMissingValuesFrom: {
          body: true
        }
      }).then(response => {
        const { json } = response.json;

        should(json.empty).eql(undefined);
        json.name.should.eql('Burgundy');
      });
    });

    it('should replace curlies with an empty string by default', () => {
      const request = createAppRequestClient(input);
      return request({
        url: 'https://httpbin.org/post',
        method: 'POST',
        body: {
          empty: '{{bundle.inputData.empty}}'
        }
      }).then(response => {
        const { json } = response.json;

        should(json.empty).eql('');
      });
    });

    it('should interpolate strings', () => {
      const event = {
        bundle: {
          inputData: {
            resourceId: 123
          },
          authData: {
            access_token: 'Let me in'
          }
        }
      };
      const bodyInput = createInput({}, event, testLogger);
      const request = createAppRequestClient(bodyInput);
      return request({
        url: 'https://httpbin.org/post',
        method: 'POST',
        body: {
          message: 'We just got #{{bundle.inputData.resourceId}}'
        },
        headers: {
          Authorization: 'Bearer {{bundle.authData.access_token}}'
        }
      }).then(response => {
        const { json, headers } = response.json;

        json.message.should.eql('We just got #123');
        headers.Authorization.should.eql('Bearer Let me in');
      });
    });

    it('should throw when interpolating a string with an array', () => {
      const event = {
        bundle: {
          inputData: {
            badData: [1, 2, 3]
          }
        }
      };
      const bodyInput = createInput({}, event, testLogger);
      const request = createAppRequestClient(bodyInput);
      return request({
        url: 'https://httpbin.org/post',
        method: 'POST',
        body: {
          message: 'No arrays, thank you: {{bundle.inputData.badData}}'
        }
      }).should.be.rejectedWith(
        'Cannot reliably interpolate objects or arrays into a string. We received an Array:\n"1,2,3"'
      );
    });

    it('should send flatten objects', () => {
      const event = {
        bundle: {
          inputData: {
            address: {
              street: '123 Zapier Way',
              city: 'El Mundo'
            }
          }
        }
      };
      const bodyInput = createInput({}, event, testLogger);
      const request = createAppRequestClient(bodyInput);
      return request({
        url: 'https://httpbin.org/post',
        method: 'POST',
        body: {
          streetAddress: '{{bundle.inputData.address.street}}',
          city: '{{bundle.inputData.address.city}}'
        }
      }).then(response => {
        const { json } = response.json;

        json.streetAddress.should.eql('123 Zapier Way');
        json.city.should.eql('El Mundo');
      });
    });

    it('should resolve all bundle fields', () => {
      const event = {
        bundle: {
          inputData: {
            resourceId: 123
          },
          authData: {
            access_token: 'Let me in'
          },
          meta: {
            limit: 20
          }
        }
      };
      const bodyInput = createInput({}, event, testLogger);
      const request = createAppRequestClient(bodyInput);
      return request({
        url: 'https://httpbin.org/get',
        method: 'GET',
        params: {
          limit: '{{bundle.meta.limit}}',
          id: '{{bundle.inputData.resourceId}}'
        },
        headers: {
          Authorization: 'Bearer {{bundle.authData.access_token}}'
        }
      }).then(response => {
        const { headers } = response.json;
        const { url } = JSON.parse(response.content);
        url.should.eql('https://httpbin.org/get?limit=20&id=123');
        headers.Authorization.should.eql('Bearer Let me in');
      });
    });
  });
});
