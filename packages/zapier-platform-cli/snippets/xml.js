const xml = require('pixl-xml');

const App = {
  // ...
  afterResponse: [
    (response, z, bundle) => {
      response.xml = xml.parse(response.content);
      return response;
    }
  ]
  // ...
};
