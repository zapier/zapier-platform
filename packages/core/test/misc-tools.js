const assert = require('assert');
const should = require('should');

const cleaner = require('../src/tools/cleaner');
const hashing = require('../src/tools/hashing');
const ensureArray = require('../src/tools/ensure-array');
const ensureJSONEncodable = require('../src/tools/ensure-json-encodable');
const requestSugar = require('../src/tools/request-sugar');
const dataTools = require('../src/tools/data');

describe('Tools', () => {
  it('should deep search and find something', () => {
    const haystack = {
      d: 55,
      e: undefined,
      a: {
        b: {
          c: 123,
        },
      },
      other: 'stuff',
      // earlyEnd: 123
    };

    const path = dataTools.findMapDeep(haystack, 123);
    path.should.eql('a.b.c');

    const path2 = dataTools.memoizedFindMapDeep(haystack, 123);
    path2.should.eql('a.b.c');

    const path3 = dataTools.memoizedFindMapDeep(haystack, 123);
    path3.should.eql('a.b.c');
  });

  it('should deep search and find something (arrays)', () => {
    const haystack = {
      d: 55,
      e: undefined,
      a: {
        b: [
          undefined,
          {
            c: 123,
          },
        ],
      },
      other: 'stuff',
      // earlyEnd: 123
    };

    const path = dataTools.findMapDeep(haystack, 123);
    path.should.eql('a.b[1].c');
  });

  it('should snip hello!', () => {
    process.env.SECRET_SALT = 'sssuuuuuuupersecret';
    hashing.snipify('hello!').should.eql(':censored:6:f5dab4e158:');
  });

  it('should truncate many things!', () => {
    const tests = [
      { value: null, length: 5, suffix: undefined, expected: null },
      { value: undefined, length: 5, suffix: '...', expected: undefined },
      { value: false, length: 5, suffix: '...', expected: '' },
      { value: '', length: 5, suffix: undefined, expected: '' },
      { value: [], length: 5, suffix: '...', expected: '' },
      { value: {}, length: 5, suffix: '...', expected: '[o...' },
      { value: () => {}, length: 5, suffix: '...', expected: '()...' },
      { value: { yeah: true }, length: 8, suffix: '...', expected: '[obje...' },
      { value: 'Something', length: 5, suffix: undefined, expected: 'Somet' },
      { value: 'Something', length: 5, suffix: '...', expected: 'So...' },
      {
        value: Buffer.from('Something'),
        length: 7,
        suffix: ' [...]',
        expected: 'S [...]',
      },
      { value: 'Something', length: 0, suffix: '...', expected: '...' },
      { value: 'Something', length: 8, suffix: '...', expected: 'Somet...' },
      { value: 'Something', length: 9, suffix: '...', expected: 'Something' },
      { value: 'Something', length: 15, suffix: '...', expected: 'Something' },
      {
        value: 'Somèt°˜ı¡•ﬁ⁄',
        length: 9,
        suffix: '...',
        expected: 'Somèt°...',
      },
      {
        value: 'Somèt°˜ı¡•ﬁ⁄',
        length: 12,
        suffix: '...',
        expected: 'Somèt°˜ı¡•ﬁ⁄',
      },
    ];

    tests.forEach((test) => {
      should(
        dataTools.simpleTruncate(test.value, test.length, test.suffix),
      ).eql(test.expected);
    });
  });

  describe('truncateData', () => {
    const testData = require('./fixtures/truncate-test-data.json');

    it('should check maxLength limitations', () => {
      const tooShort = (o) => () => dataTools.truncateData(o, 0);
      tooShort({}).should.throw(/maxLength must be at least 40/);
      tooShort([]).should.throw(/maxLength must be at least 40/);
    });

    it('should truncate data to improve logging efficiency', () => {
      testData.forEach((test) => {
        const truncated = dataTools.truncateData(test.input, test.maxLength);
        truncated.should.deepEqual(test.output);
        if (test.expectedLength) {
          JSON.stringify(truncated).length.should.eql(test.expectedLength);
        }
      });
    });

    it('should always result in output with a stringified length <= to maxLength', () => {
      const totalLength = JSON.stringify(testData).length;
      for (let i = 40; i < totalLength; i += 1) {
        const truncated = dataTools.truncateData(testData, i);
        JSON.stringify(truncated).length.should.lessThanOrEqual(i);
      }
    });
  });

  // it('should prepareRequestLog', () => {
  //   const request = {
  //     url: 'https://www.google.com',
  //     headers: {
  //       a: 'b'
  //     },
  //     body: 'request body'
  //   };

  //   const response = {
  //     status: 200,
  //     headers: {
  //       c: 'd'
  //     },
  //     body: 'response body'
  //   };

  //   const expected = {
  //     message: '200 GET https://www.google.com',
  //     data: {
  //       log_type: 'http',
  //       request_type: 'devplatform-outbound',
  //       request_url: 'https://www.google.com',
  //       request_method: 'GET',
  //       request_headers: 'a: b',
  //       response_status_code: 200,
  //       request_data: 'request body',
  //       response_headers: 'c: d',
  //       response_content: 'response body'
  //     }
  //   };

  //   const actual = logging.prepareRequestLog(request, response, false);

  //   actual.should.eql(expected);
  // });

  describe('deepFreeze', () => {
    it('should not let you tweak stuff', () => {
      const output = dataTools.deepFreeze({
        funcArity: (a, b, c) => {
          return c;
        },
        funcArityArgs: function (a, b) {
          a = arguments;
          return b;
        },
        nested: {
          thing: 1234,
        },
      });
      output.cheese = 'cat';
      should(output.cheese).eql(undefined);
      output.nested.nope = 'NAHHH';
      should(output.nested.nope).eql(undefined);
      should(output.funcArity(3, 3, 3)).eql(3);
    });
  });

  describe('flatten', () => {
    it('should flatten things', () => {
      const output = dataTools.flattenPaths({
        a: {
          b: 1,
          c: 2,
          d: {
            e: 3,
          },
          f: null,
        },
        g: [4],
        h: 5,
        i: undefined,
      });

      output.should.eql({
        'a.b': 1,
        'a.c': 2,
        'a.d.e': 3,
        'a.f': null,
        g: [4],
        h: 5,
        i: undefined,
      });
    });

    it('should flatten things but preserve values from provided keys', () => {
      const output = dataTools.flattenPaths(
        {
          a: {
            b: 1,
            c: 2,
            d: {
              e: 3,
              z: {
                y: 'because',
              },
            },
            f: null,
          },
          g: [4],
          h: 5,
          i: undefined,
        },
        { preserve: { 'a.d': true } },
      );

      output.should.eql({
        'a.b': 1,
        'a.c': 2,
        'a.d.e': 3,
        'a.d.z': { y: 'because' },
        'a.d.z.y': 'because',
        'a.f': null,
        g: [4],
        h: 5,
        i: undefined,
      });
    });
  });

  describe('recurseCleanFuncs', () => {
    it('should handle objects, arrays and function->str', () => {
      const output = cleaner.recurseCleanFuncs({
        hello: 'world',
        number: 1234,
        arr: ['0', 1],
        nested: { hello: 'world' },
        func: () => {},
        funcArity: (a, b, c) => {
          return c;
        },
        funcArityArgs: function (a, b) {
          a = arguments;
          return b;
        },
        funcNested: {
          deeper: () => {},
        },
      });
      const expected = {
        hello: 'world',
        number: 1234,
        arr: ['0', 1],
        nested: { hello: 'world' },
        func: '$func$0$f$',
        funcArity: '$func$3$f$',
        funcArityArgs: '$func$2$t$',
        funcNested: { deeper: '$func$0$f$' },
      };
      output.should.eql(expected);
    });
  });

  describe('ensureArray', () => {
    it('should convert single object to array', () => {
      const o = { a: 1 };
      ensureArray(o).should.eql([o]);
    });

    it('should convert empty array to empty array', () => {
      ensureArray([]).should.eql([]);
    });

    it('should convert null to empty array', () => {
      ensureArray(null).should.eql([]);
    });

    it('should convert to undefined to empty array', () => {
      ensureArray(undefined).should.eql([]);
    });
  });

  describe('recurseReplaceBank', () => {
    it('should replace stuff with recurseReplaceBank', () => {
      const obj = {
        multi: '{{somekey}} {{somekey}} hi!',
        thing: '{{somekey}} hi!',
        arr: ['{{somekey}} hi!'],
        x: {
          a: '{{somekey}}',
          c: '{{somekey}} x',
        },
      };
      const bank = {
        '{{somekey}}': 'lolz',
      };
      const out = cleaner.recurseReplaceBank(obj, bank);
      out.should.eql({
        multi: 'lolz lolz hi!',
        thing: 'lolz hi!',
        arr: ['lolz hi!'],
        x: {
          a: 'lolz',
          c: 'lolz x',
        },
      });
    });

    it('should recursively resolve curlies', () => {
      const req = {
        headers: {
          // 2 matches in a row caused a bug, so make sure to test that
          a: '{{bundle.authData.access_token}}',
          b: '{{bundle.authData.access_token}}',
        },
      };
      const bank = {
        '{{bundle.authData.access_token}}': 'Let me in',
      };

      const res = cleaner.recurseReplaceBank(req, bank);
      res.headers.a.should.eql('Let me in');
      res.headers.b.should.eql('Let me in');
    });
  });

  describe('createRequestOptions', () => {
    it('should allow single url param', () => {
      const options = requestSugar.createRequestOptions('https://foo.com');
      options.should.eql({ url: 'https://foo.com' });
    });

    it('should allow single options param', () => {
      const options = requestSugar.createRequestOptions({
        url: 'https://foo.com',
        headers: { a: 'b' },
      });
      options.should.eql({
        url: 'https://foo.com',
        headers: { a: 'b' },
      });
    });

    it('should should allow url param and options param', () => {
      const options = requestSugar.createRequestOptions('https://foo.com', {
        headers: { a: 'b' },
      });
      options.should.eql({
        url: 'https://foo.com',
        headers: { a: 'b' },
      });
    });
  });

  describe('ensureJsonEncodable', () => {
    it('should return successfully without error for JSON-encodable data', () => {
      ensureJSONEncodable(null);
      ensureJSONEncodable(1.23456);
      ensureJSONEncodable('hello');
      ensureJSONEncodable({ foo: 'bar' });
      ensureJSONEncodable({ foo: { bar: 'baz' } });
      ensureJSONEncodable({ foo: { bar: 'baz', items: [null, 1234, {}] } });

      // These object keys are stringified by JSON.stringify(), e.g., 12.34 ->
      // '12.34', so I guess we can consider them JSON-encodable.
      ensureJSONEncodable({ 12.34: 56.78 });
      ensureJSONEncodable({ [null]: true });
      ensureJSONEncodable({ [undefined]: true });
    });

    it('should throw error for data that are not JSON-encodable', () => {
      assert.throws(
        () => {
          ensureJSONEncodable(undefined);
        },
        {
          name: 'TypeError',
          message: "Type 'undefined' is not JSON-encodable (path: '')",
        },
      );
      assert.throws(
        () => {
          ensureJSONEncodable(/hello/);
        },
        {
          name: 'TypeError',
          message: "Type 'object' is not JSON-encodable (path: '')",
        },
      );
      assert.throws(
        () => {
          ensureJSONEncodable(console);
        },
        {
          name: 'TypeError',
          message: "Type 'object' is not JSON-encodable (path: '')",
        },
      );
      assert.throws(
        () => {
          ensureJSONEncodable({ foo: [null, { xyz: undefined }] });
        },
        {
          name: 'TypeError',
          message: "Type 'undefined' is not JSON-encodable (path: 'foo.1.xyz')",
        },
      );
      assert.throws(
        () => {
          ensureJSONEncodable(function () {});
        },
        {
          name: 'TypeError',
          message: "Type 'function' is not JSON-encodable (path: '')",
        },
      );
      assert.throws(
        () => {
          ensureJSONEncodable({ foo: [null, { hello: function () {} }] });
        },
        {
          name: 'TypeError',
          message:
            "Type 'function' is not JSON-encodable (path: 'foo.1.hello')",
        },
      );
      assert.throws(
        () => {
          const obj = { num: 1 };
          obj.items = [{ self: obj }];
          ensureJSONEncodable(obj);
        },
        {
          name: 'TypeError',
          message:
            "Circular structure is not JSON-encodable (path: 'items.0.self')",
        },
      );
    });
  });
});
