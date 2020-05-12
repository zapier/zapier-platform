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
  else if (response.status === 200 && response.json.success === false) {
    throw new z.errors.Error(response.json.message, response.json.code);
  }

  return response;
};

const App = {
  // ...
  beforeRequest: [addHeader],
  afterResponse: [handleErrors],
  // ...
};
