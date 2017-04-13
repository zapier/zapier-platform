const addHeader = (request, /*z*/) => {
  request.headers['my-header'] = 'from zapier';
  return request;
};

const mustBe200 = (response, /*z*/) => {
  if (response.status !== 200) {
    throw new Error(`Unexpected status code ${response.status}`);
  }
  return response;
};

const autoParseJson = (response, z) => {
  response.json = z.JSON.parse(response.content);
  return response;
};

const App = {
  // ...
  beforeRequest: [
    addHeader,
  ],
  afterResponse: [
    mustBe200,
    autoParseJson,
  ]
  // ...
};
