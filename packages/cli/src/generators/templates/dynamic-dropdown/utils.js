// Some handy stuff that's used in various places

// Extract the numeric ID from a URL like 'https://swapi.dev/api/people/1/'
const extractID = (urlString) => {
  const match = urlString.match(/\/(\d+)\/?$/);
  if (match) {
    return parseInt(match[1]);
  }
  throw new Error(`ID not found in URL: ${urlString}`);
};

module.exports = { extractID };
