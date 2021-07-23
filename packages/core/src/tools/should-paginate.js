const { get } = require('lodash');

// this is (annoyingly) mirrored in cli/api_base, so that test functions only
// have a storeKey when canPaginate is true. otherwise, a test would work but a
// poll on site would fail. this is only used in test handlers

// there are 2 places you can put a method that can interact with cursors:
// triggers.contact.operation.perform, if it's a poll trigger
// resources.contact.list.operation.perform if it's a resource
// schema doesn't currently allow cursor use on hook trigger `performList`, so we don't need to account for it
const shouldPaginate = (appRaw, method) => {
  const methodParts = method.split('.');
  const methodName = methodParts.pop();
  const operation = get(appRaw, methodParts);

  if (methodParts[0] === 'triggers') {
    if (operation.type === 'poll' && methodName === 'perform') {
      return !!operation.canPaginate;
    }

    if (operation.type === 'hook' && methodName === 'performList') {
      return !!operation.canPaginate;
    }
  }

  if (methodParts[0] === 'resources') {
    if (methodParts[2] === 'list' && methodName === 'perform') {
      return !!operation.canPaginate;
    }

    if (methodParts[2] === 'hook' && methodName === 'performList') {
      return !!operation.canPaginate;
    }
  }

  return false;
};

module.exports = {
  shouldPaginate,
};
