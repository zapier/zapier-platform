const xml = require('pixl-xml');

const App = {
  // ...
  afterResponse: [
    (response, z, bundle) => {
      response.xml = xml.parse(response.content);
      // When you define an `afterResponse`, make sure one of them calls `throwForStatus`
      response.throwForStatus();
      return response;
    }
  ]
  // ...
};
