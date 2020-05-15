const xml = require('pixl-xml');

const App = {
  // ...
  afterResponse: [
    (response, z, bundle) => {
      response.throwForStatus();
      response.data = xml.parse(response.content);
      return response;
    },
  ],
  // ...
};
