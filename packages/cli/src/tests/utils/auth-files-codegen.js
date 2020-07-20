const authFiles = require('../../utils/auth-files-codegen');

const { format } = require('prettier');

describe('auth file codegen', () => {
  Object.entries(authFiles).forEach(([authType, fileFunc]) => {
    it(`${authType} auth should have a syntactically valid auth file`, () => {
      // this throws if the file isn't valid
      format(fileFunc(), { parser: 'babel' });
    });
  });
});
