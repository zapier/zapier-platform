const xml = require('pixl-xml');

const App = {
  // ...
  afterResponse: [
    (response, z, bundle) => {
      // Only works on core v10+!
      response.throwForStatus();
      response.data = xml.parse(response.content);
      return response;
    },
  ],
  // ...
};
