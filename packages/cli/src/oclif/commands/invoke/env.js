const fsP = require('node:fs/promises');

/** Prefix used for auth data fields in the .env file */
const AUTH_FIELD_ENV_PREFIX = 'authData_';

/**
 * Loads authData from environment variables.
 * Looks for variables prefixed with AUTH_FIELD_ENV_PREFIX and parses JSON values.
 * @returns {Object} An object containing auth field keys and their values
 */
const loadAuthDataFromEnv = () => {
  return Object.entries(process.env)
    .filter(([k, v]) => k.startsWith(AUTH_FIELD_ENV_PREFIX))
    .reduce((authData, [k, v]) => {
      const fieldKey = k.substr(AUTH_FIELD_ENV_PREFIX.length);
      // Try to parse as JSON if it looks like JSON, otherwise keep as string
      try {
        authData[fieldKey] =
          v.startsWith('{') || v.startsWith('[') ? JSON.parse(v) : v;
      } catch (e) {
        // If JSON parsing fails, keep as string
        authData[fieldKey] = v;
      }
      return authData;
    }, {});
};

/**
 * Appends variables to the .env file.
 * Handles proper formatting and ensures newline separation.
 * @param {Object} vars - Key-value pairs to append
 * @param {string} [prefix=''] - Prefix to add to each variable name
 * @returns {Promise<void>}
 */
const appendEnv = async (vars, prefix = '') => {
  const envFile = '.env';
  let content = Object.entries(vars)
    .filter(([k, v]) => v !== undefined)
    .map(
      ([k, v]) =>
        `${prefix}${k}='${typeof v === 'object' && v !== null ? JSON.stringify(v) : v || ''}'\n`,
    )
    .join('');

  // Check if .env file exists and doesn't end with newline
  try {
    const existingContent = await fsP.readFile(envFile, 'utf8');
    if (existingContent.length > 0 && !existingContent.endsWith('\n')) {
      content = '\n' + content;
    }
  } catch (error) {
    // File doesn't exist or can't be read, proceed as normal
  }

  await fsP.appendFile(envFile, content);
};

module.exports = {
  AUTH_FIELD_ENV_PREFIX,
  loadAuthDataFromEnv,
  appendEnv,
};
