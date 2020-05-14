// prepare headers object - plain object for serialization later
const plainHeaders = (headers) => {
  const _headers = {};
  headers.forEach((value, name) => {
    _headers[name] = value;
  });
  return _headers;
};

// Return the normal resp.headers, but with more goodies (toJSON support).
const replaceHeaders = (resp) => {
  const getHeader = (name) => resp.headers.get(name);

  Object.defineProperty(resp.headers, 'toJSON', {
    enumerable: false,
    value: () => plainHeaders(resp.headers),
  });

  return {
    headers: resp.headers,
    getHeader,
  };
};

module.exports = {
  replaceHeaders,
};
