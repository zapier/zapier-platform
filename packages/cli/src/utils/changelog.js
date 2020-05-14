const _ = require('lodash');
const path = require('path');

const { readFile } = require('./files');

const getChangelogFromMarkdown = (version, markdown) => {
  const lines = markdown
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n');

  let startingLine = _.findIndex(lines, (line) =>
    RegExp(`## .*${version}`).test(line)
  );

  if (startingLine === -1) {
    return '';
  }

  // Skip the line with the version, and the next line (expected blank)
  startingLine += 2;

  let endingLine = _.findIndex(
    lines,
    (line) => line.indexOf('## ') === 0,
    startingLine
  );

  if (endingLine === -1) {
    endingLine = lines.length;
  }

  // Skip the line before the next version (expected blank)
  endingLine -= 1;

  const changelogLines = lines.slice(startingLine, endingLine);

  return changelogLines.join('\n');
};

const getVersionChangelog = (version, appDir = '.') => {
  const file = path.resolve(appDir, 'CHANGELOG.md');

  return readFile(file)
    .then((buffer) => getChangelogFromMarkdown(version, buffer.toString()))
    .catch(() => ''); // We're ignoring files that don't exist or that aren't readable
};

module.exports = {
  getVersionChangelog,
};
