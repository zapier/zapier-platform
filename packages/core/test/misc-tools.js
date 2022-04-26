const should = require('should');

const cleaner = require('../src/tools/cleaner');
const hashing = require('../src/tools/hashing');
const ensureArray = require('../src/tools/ensure-array');
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
        dataTools.simpleTruncate(test.value, test.length, test.suffix)
      ).eql(test.expected);
    });
  });

  it('should check truncateData length limitations', () => {
    const tooShort = (o) => () => dataTools.truncateData(o, 0);
    tooShort({}).should.throw(/maxLength must be at least 39/);
    tooShort([]).should.throw(/maxLength must be at least 38/);
  });

  it('should truncate data to improve efficiency', () => {
    const tests = [
      {
        value:
          '{"authData":{"api_key":"b81ed2f2-52c7-4c0b-80c7-f5142133172c"},"inputData":{},"inputDataRaw":{},"met' +
          'a":{"isLoadingSample":false,"isFillingDynamicDropdown":false,"isTestingAuth":false,"isPopulatingDedu' +
          'pe":false,"limit":-1,"page":0,"isBulkRead":false,"zap":{"help":["This data structure is provided for' +
          ' backwards compatibility,","and should not be relied upon in a Zapier integration."],"id":"subscript' +
          'ion:17256840","link":"https://zapier.com/app/editor/subscription:17256840","live":true,"name":"A Zap' +
          '","user":{"timezone":"America/Indiana/Indianapolis"},"trigger":{"service":{"logos":{"16x16":"https:/' +
          '/cdn.zapier.com/storage/photos/73a6433488cca7c5bd6ed9836fd6d9c8.png","32x32":"https://cdn.zapier.com' +
          '/storage/photos/73a6433488cca7c5bd6ed9836fd6d9c8.png","64x64":"https://cdn.zapier.com/storage/photos' +
          '/73a6433488cca7c5bd6ed9836fd6d9c8.png","128x128":"https://cdn.zapier.com/storage/photos/73a6433488cc' +
          'a7c5bd6ed9836fd6d9c8.png"},"name":"A Zapier App"}},"action":{"service":{"logos":{"16x16":"https://cd' +
          'n.zapier.com/storage/photos/73a6433488cca7c5bd6ed9836fd6d9c8.png","32x32":"https://cdn.zapier.com/st' +
          'orage/photos/73a6433488cca7c5bd6ed9836fd6d9c8.png","64x64":"https://cdn.zapier.com/storage/photos/73' +
          'a6433488cca7c5bd6ed9836fd6d9c8.png","128x128":"https://cdn.zapier.com/storage/photos/73a6433488cca7c' +
          '5bd6ed9836fd6d9c8.png"},"name":"A Zapier App"}}}}}',
        length: 250,
        expected:
          '{"authData":{"api_key":"b81ed2f2-52c7-4c0b-80c7-f5142133172c"},"inputData":{},"inputDataRaw":{},"met' +
          'a":{"isLoadingSample":false,"isFillingDynamicDropdown":false,"isTestingAuth":false,"isPopulatingDedu' +
          'pe":false},"NOTE":"This data has been truncated."}',
      },
      {
        value:
          '[{"id":1,"first_name":"Alvis","last_name":"Baish","ip_address":"152.55.253.129"},{"id":2,"first_name' +
          '":"Roxine","last_name":"Meah","ip_address":"194.125.26.25"},{"id":3,"first_name":"Olva","last_name":' +
          '"Copins","ip_address":"61.163.179.10"},{"id":4,"first_name":"Thomas","last_name":"Jury","ip_address"' +
          ':"63.200.70.181"},{"id":5,"first_name":"Leoline","last_name":"Barthorpe","ip_address":"82.41.102.177' +
          '"},{"id":6,"first_name":"Benjamen","last_name":"Bynert","ip_address":"40.242.37.77"},{"id":7,"first_' +
          'name":"Hillyer","last_name":"Brighouse","ip_address":"81.130.27.24"},{"id":8,"first_name":"Inger","l' +
          'ast_name":"Bavin","ip_address":"159.53.220.53"},{"id":9,"first_name":"Brier","last_name":"Drover","i' +
          'p_address":"128.160.157.77"},{"id":10,"first_name":"Garrett","last_name":"Broddle","ip_address":"229' +
          '.80.187.137"},{"id":11,"first_name":"Marwin","last_name":"Espie","ip_address":"222.102.146.189"},{"i' +
          'd":12,"first_name":"Lucian","last_name":"Catley","ip_address":"251.72.199.116"},{"id":13,"first_name' +
          '":"Diarmid","last_name":"Scothorne","ip_address":"14.244.169.107"},{"id":14,"first_name":"Ricca","la' +
          'st_name":"Ollerearnshaw","ip_address":"132.88.63.202"},{"id":15,"first_name":"Jacquenette","last_nam' +
          'e":"Cowcha","ip_address":"163.126.95.174"}]',
        length: 250,
        expected:
          '[{"id":15,"first_name":"Jacquenette","last_name":"Cowcha","ip_address":"163.126.95.174"},{"id":14,"f' +
          'irst_name":"Ricca","last_name":"Ollerearnshaw","ip_address":"132.88.63.202"},{"id":13,"first_name":"' +
          'Diarmid"},"NOTE: This data has been truncated."]',
      },
    ];
    tests.forEach((test) => {
      const data = JSON.parse(test.value);
      const expected = JSON.parse(test.expected);
      const truncated = dataTools.truncateData(data, test.length);
      should(truncated).deepEqual(expected);
      should(JSON.stringify(truncated).length).lessThanOrEqual(test.length);
    });
  });

  it('should not mangle data when truncating', () => {
    const tests = [
      '{}',
      '{"a":null}',
      '{"a":null,"b":1}',
      '{"a":null,"b":1,"c":true}',
      '{"a":null,"b":1,"c":true,"d":"hello"}',
      '{"a":null,"b":1,"c":true,"d":"hello","e":{}}',
      '{"a":null,"b":1,"c":true,"d":"hello","e":{"f":"world"}}',
      '{"a":null,"b":1,"c":true,"d":"hello","e":{"f":"world","g":[1,2,3]}}',
      '{"a":null,"b":1,"c":true,"d":"hello","e":{"f":"world","g":[1,2,3]},"h":[4,5,6]}',
      '[{"a":null,"b":1,"c":true,"d":"hello","e":{"f":"world","g":[1,2,3]},"h":[4,5,6]}]',
    ];

    tests.forEach((test) => {
      const expected = JSON.parse(test);
      const truncated = dataTools.truncateData(expected, 1000);
      should(truncated).deepEqual(expected);
      should(JSON.stringify(truncated).length).lessThanOrEqual(1000);
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
        { preserve: { 'a.d': true } }
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
});
