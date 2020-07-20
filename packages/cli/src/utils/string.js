const path = require('path');

function splitFileFromPath(filePath, extension = 'js') {
  const { name, base, dir, ext } = path.parse(filePath);
  const filename = ext ? base : `${name}.${extension}`;

  return [dir, filename];
}

module.exports = {
  splitFileFromPath,
};
