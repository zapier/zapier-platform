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

const autoParseJson = (response, z, bundle) => {
  response.json = z.JSON.parse(response.content);
  return response;
};

const App = {
  // ...
  beforeRequest: [addHeader],
  afterResponse: [mustBe200, autoParseJson]
  // ...
};
