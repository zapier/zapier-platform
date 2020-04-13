const addHeader = (request, z, bundle) => {
  request.headers['my-header'] = 'from zapier';
  return request;
};

const mustBe200 = (response, z, bundle) => {
  if (response.status !== 200) {
    throw new Error(`Unexpected status code ${response.status}`);
  }
  return response;
};

const handleErrors = (response, z) => {
  // Throw an error that `throwForStatus` wouldn't throw (correctly) for.
  if (response.status === 206) {
    throw new z.errors.Error(
      `Received incomplete data: ${response.json.error_message}`,
      response.json.error_code,
      response.status
    );
  }

  // Prevent `throwForStatus` from throwing for a certain status.
  if (response.status === 404) {
    return response;
  }

  response.throwForStatus();

  return response;
};

const autoParseJson = (response, z, bundle) => {
  response.json = z.JSON.parse(response.content);
  return response;
};

const App = {
  // ...
  beforeRequest: [addHeader],
  afterResponse: [handleErrors, autoParseJson]
  // ...
};
