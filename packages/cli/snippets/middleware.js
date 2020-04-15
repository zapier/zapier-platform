const addHeader = (request, z, bundle) => {
  request.headers['my-header'] = 'from zapier';
  return request;
};

const mustBe200 = (response, z, bundle) => {
  if (response.status !== 200) {
    throw new z.errors.Error(
      `Unexpected status code ${response.status}`,
      'UnexpectedStatus',
      response.status
    );
  }
  // throw for standard error statuses
  response.throwForStatus();
  return response;
};

const App = {
  // ...
  beforeRequest: [addHeader],
  afterResponse: [mustBe200]
  // ...
};
