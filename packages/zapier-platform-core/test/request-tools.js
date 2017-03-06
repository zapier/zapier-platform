'use strict';

require('should');
const requestMerge = require('../src/tools/request-merge');

describe('request tools', () => {
  it('should merge requests', () => {
    var request = requestMerge(
      {params: {'api-key': 'dcba'}, headers: {'ApI-kEy': 'abcd'}},
      {url: 'http://example.com?cat=mouse', params: {hello: 'world'}}
    );
    var expected = {
      method: 'GET',
      url: 'http://example.com',
      params: {
        'api-key': 'dcba',
        'hello': 'world',
        'cat': 'mouse'
      },
      headers: {
        'user-agent': 'Zapier',
        'ApI-kEy': 'abcd'
      }
    };
    request.should.eql(expected);
  });

  it('should drop headers', () => {
    var request = requestMerge(
      {url: 'http://example.com', headers: {'api-key': 'abcd'}},
      {headers: {'api-key': ''}}
    );
    var expected = {
      method: 'GET',
      url: 'http://example.com',
      params: {},
      headers: {
        'user-agent': 'Zapier'
      }
    };
    request.should.eql(expected);
  });

});
