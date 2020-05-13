const addHeader = (request, z, bundle) => {
  request.headers['my-header'] = 'from zapier';
  return request;
};

const handleErrors = (response, z) => {
  // Prevent `throwForStatus` from throwing for a certain status.
  if (response.status === 456) {
    response.skipThrowForStatus = true;
  }

  // Throw an error that `throwForStatus` wouldn't throw (correctly) for.
  else if (response.status === 200 && response.data.success === false) {
    throw new z.errors.Error(response.data.message, response.data.code);
  }
};

const parseXML = (response, z, bundle) => {
  // Parse content that is not JSON
  // eslint-disable-next-line no-undef
  response.data = xml.parse(response.content);
  return response;
};

const App = {
  // ...
  beforeRequest: [addHeader],
  afterResponse: [parseXML, handleErrors],
  // ...
};
