const semver = require('semver');

function isVersionCompatible({ versionCurrent, versionGoal }) {
  // First, check if both versions have the same major version
  if (semver.major(versionGoal) !== semver.major(versionCurrent)) {
    return false;
  }

  // Create a range that represents all versions less the 'versionGoal'
  const versionRange = `<${versionGoal}`;

  // Check if 'versionCurrent' falls within this range
  return semver.satisfies(versionCurrent, versionRange);
}

module.exports = { isVersionCompatible };
