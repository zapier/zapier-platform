const obj = (...properties) => `
    {
      ${properties.join(',\n')}
    }
  `;

const exportStatement = obj => `
module.exports = ${obj}
`;

const maybeQ = valueIsStr => (valueIsStr ? "'" : '');
/**
 * @param {string} key could be a variable name or string value
 * @param {string | undefined} value can either be a variable or actual string. or could be missing, in which case the input is treated as a variable
 * @param {boolean} shouldWrap denotes whether we should wrap the value in quotes. ignored if value is undefined
 */
const objProperty = (key, value, shouldWrap = false) => {
  if (value === undefined) {
    return `${key}`;
  }
  return `'${key}': ${maybeQ(shouldWrap)}${value}${maybeQ(shouldWrap)}`;
};

const func = (varName, args, ...statements) => `
  const ${varName} = (${args.join(', ')}) => {
    ${statements.join('\n')}
  }
`;

const zRequest = (url, ...properties) => `
  z.request({
    url: '${url}',
    ${properties.join(',\n')}
  })
`;

// trim here is important because ASI adds a semi after a lonely return
const returnStatement = statement => `return ${statement.trim()}`;
const arr = (...elements) => `[${elements.join(', ')}]`;
const zResponseErr = (message, type = 'AuthenticationError') => `
  throw new z.errors.Error(
    // This message is surfaced to the user
    '${message}',
    '${type}',
    response.status
  )
`;
const ifStatement = (condition, ...results) => `
    if (${condition}) {
      ${results.join('\n')}
    }
`;

const file = (...statements) => statements.join('\n');
module.exports = {
  obj,
  exportStatement,
  objProperty,
  func,
  zRequest,
  returnStatement,
  arr,
  zResponseErr,
  ifStatement,
  file
};
