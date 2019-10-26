function splitFileFromPath(filePath, extension = 'js') {
  const destParts = filePath.split('/');
  const filename = destParts
    .splice(-1, 1)
    .concat(`.${extension}`)
    .join('');
  const dirPath = destParts.join('/');
  return [filename, dirPath];
}

module.exports = {
  splitFileFromPath
};
