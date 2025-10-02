const BASE_URL = 'https://registry.npmjs.org';

const getPackageLatestVersion = async (name) => {
  const baseUrl = `${BASE_URL}/${name}`;
  const res = await fetch(baseUrl);
  const packageInfo = await res.json();
  return packageInfo['dist-tags'].latest;
};

const getPackageSize = async (name, version) => {
  const baseUrl = `${BASE_URL}/${name}`;
  const res = await fetch(`${baseUrl}/-/${name}-${version}.tgz`);
  return res.headers.get('content-length');
};

module.exports = {
  getPackageLatestVersion,
  getPackageSize,
};
