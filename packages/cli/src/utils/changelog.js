const _ = require('lodash');
const path = require('path');

const { readFile } = require('./files');

// Turns an empty array into undefined so it will not be present in the body when sent
const absentIfEmpty = (arr) => (arr.length === 0 ? undefined : arr);

const getAppMetadata = (line) => {
  // App metadata must be in the form of <change type>-<action key>:<action type>
  return Array.from(
    line.matchAll(/(?<changeType>\w+)-(?<actionKey>\w+):(?<actionType>\w+)/gm)
  )
    .flatMap((match) => match.groups)
    .map(
      (group) =>
        group?.changeType &&
        group?.actionKey &&
        group?.actionType && {
          app_change_type: group.changeType,
          action_key: group.actionKey,
          action_type: group.actionType,
        }
    )
    .filter(Boolean);
};

const getIssueMetadata = (line) => {
  // Issue metadata must be in the form <change type>-<issue id>
  return Array.from(line.matchAll(/(?<changeType>\w+)-(?<issueId>\d+)/gm))
    .flatMap((match) => match.groups)
    .map(
      (group) =>
        group?.changeType &&
        !isNaN(group?.issueId) && {
          app_change_type: group.changeType,
          issue_id: Number(group.issueId), // must be a number due to \d+ match
        }
    )
    .filter(Boolean);
};

const getChangelogFromMarkdown = (version, markdown) => {
  const lines = markdown
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n');

  let startingLine = _.findIndex(lines, (line) =>
    RegExp(`## .*${version}`).test(line)
  );

  if (startingLine === -1) {
    throw Error('Invalid start position');
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
  const changelog = [];
  const appMetadata = [];
  const issueMetadata = [];

  for (const line of changelogLines) {
    if (line.startsWith('APP')) {
      appMetadata.push(...getAppMetadata(line));
    } else if (line.startsWith('ISSUES')) {
      issueMetadata.push(...getIssueMetadata(line));
    } else {
      // We skip lines that contain metadata as they will be submitted separately
      changelog.push(line);
    }
  }

  return {
    changelog: changelog.join('\n'),
    appMetadata: absentIfEmpty(appMetadata),
    issueMetadata: absentIfEmpty(issueMetadata),
  };
};

const getVersionChangelog = async (version, appDir = '.') => {
  const file = path.resolve(appDir, 'CHANGELOG.md');

  return readFile(file)
    .then((buffer) => getChangelogFromMarkdown(version, buffer.toString()))
    .catch(() => ({ changelog: '' })); // We're ignoring files that don't exist or that aren't readable
};

module.exports = {
  getVersionChangelog,
};
