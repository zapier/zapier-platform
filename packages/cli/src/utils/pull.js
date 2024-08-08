const path = require('path');
const fs = require('fs');

async function getGitIgnorePatterns(dir) {
  const gitignorePath = path.join(dir, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = await fs.promises.readFile(gitignorePath, 'utf8');
    return gitignoreContent.split('\n').filter(line => line && !line.startsWith('#'));
  }
  return [];
}

module.exports = {
  getGitIgnorePatterns
};