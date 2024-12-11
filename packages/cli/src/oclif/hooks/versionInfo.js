// customize the output of `zapier --version`
// see: https://github.com/oclif/oclif/issues/254#issuecomment-591433963

const { get } = require('lodash');
const { PLATFORM_PACKAGE } = require('../../constants');
const path = require('path');

const VERSION_ARGS = ['version', '-v', '--version', '-V'];

module.exports = (options) => {
  const firstArg = options.id;
  if (!VERSION_ARGS.includes(firstArg)) {
    return;
  }

  console.log(
    [
      `* CLI version: ${options.config.version}`,
      `* Node.js version: ${process.version}`,
      `* OS info: ${options.config.platform}-${options.config.arch}`,
    ].join('\n'),
  );

  try {
    const pJson = require(path.join(process.cwd(), 'package.json'));

    // are we in an app directory?
    const maybeCoreDepVersion = get(pJson, ['dependencies', PLATFORM_PACKAGE]);
    if (maybeCoreDepVersion) {
      console.log(
        `* \`${PLATFORM_PACKAGE}\` dependency: ${maybeCoreDepVersion}`,
      );
    }
  } catch {}

  // very important to exit, this will eventually fail to find a command
  process.exit(0);
};
