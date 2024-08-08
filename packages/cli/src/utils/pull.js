const crypto = require('crypto');

const { writeZapierConfig } = require('./api');

const calculateAppHash = (file) => {
  const sum = crypto.createHash('sha256');
  sum.update(file);
  return sum.digest('hex');
};

const downloadRemoteApp = async () => {
  // const app = await getWritableApp()
  // const appZip = await callAPI(`/apps/${app.id}/versions/${app.version}/source`);
  // const appZip = fs.readFileSync('/Users/stanleychin/Downloads/ea12d137f40834481144398a97ac0b37.zip')
  // const hash = calculateAppHash(appZip)
  const hash =
    '948330d9f022045fbd2989695c7adbd489e2f23727dd7709c13fd83351722f29';
  console.log('hash', hash);
  await writeZapierConfig(null, hash);
};

module.exports = {
  calculateAppHash,
  downloadRemoteApp,
};
