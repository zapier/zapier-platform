const _ = require('lodash');
const dataTools = require('./data');

const responseCleaner = response => {
  response.request = _.pick(
    response.request,
    'method',
    'url',
    'params',
    'headers',
    'body',
    'data'
  );
  response = _.pick(response, 'status', 'content', 'headers', 'request');
  return dataTools.jsonCopy(response);
};

module.exports = responseCleaner;
