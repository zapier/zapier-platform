const addHeader = (request, z, bundle) => {
  request.headers['my-header'] = 'from zapier';
  return request;
};

// This example only works on core v10+!
const parseXML = (response, z, bundle) => {
  // Parse content that is not JSON
  // eslint-disable-next-line no-undef
  response.data = xml.parse(response.content);
  return response;
};

// This example only works on core v10+!
const handleWeirdErrors = (response, z) => {
  // Prevent `throwForStatus` from throwing for a certain status.
  if (response.status === 456) {
    response.skipThrowForStatus = true;
  } else if (response.status === 200 && response.data.success === false) {
    throw new z.errors.Error(response.data.message, response.data.code);
  }
  return response;
};

const App = {
  // ...
  beforeRequest: [addHeader],
  afterResponse: [parseXML, handleWeirdErrors],
  // ...
};
