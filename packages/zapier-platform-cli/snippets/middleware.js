const addHeader = (request) => {
  request.headers['my-header'] = 'from zapier';
  return request;
};

const mustBe200 = (response) => {
  if (response.status !== 200) {
    throw new Error(`Unexpected status code ${response.status}`);
  }
  return response;
};

const autoParseJson = (response) => {
  response.json = JSON.parse(response.content);
  return response;
};

const App = {
  // ...
  beforeRequest: [
    addHeader,
  ],
  afterRequest: [
    mustBe200,
    autoParseJson,
  ]
  // ...
};
