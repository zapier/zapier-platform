const { get } = require('lodash');

// this is (annoyingly) mirrored in cli/api_base, so that test functions only
// have a storeKey when canPaginate is true. otherwise, a test would work but a
// poll on site would fail. this is only used in test handlers

// there are 4 places you can put a method that can interact with cursors:
// triggers.contact.operation.perform, if it's a poll trigger
// triggers.contact.operation.performList, if it's a hook trigger
// resources.contact.list.operation.perform if it's a resource
// resources.contact.hook.operation.performList if it's a resource

const shouldPaginate = (appRaw, method) => {
  const methodParts = method.split('.');
  const methodName = methodParts.pop();
  const operation = get(appRaw, methodParts);

  if (methodParts[0] === 'triggers') {
    // Polling operations may not specify type
    if (
      ['polling', undefined].includes(operation.type) &&
      methodName === 'perform'
    ) {
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
