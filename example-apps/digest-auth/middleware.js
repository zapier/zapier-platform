'use strict';

// This function runs after every outbound request. You can use it to check for
// errors or modify the response. You can have as many as you need. They'll need
// to each be registered in your index.js file.
const handleBadResponses = (response, z, bundle) => {
  if (response.status === 401) {
    throw new z.errors.Error(
      // This message is surfaced to the user
      'The username and/or password you supplied is incorrect',
      'AuthenticationError',
      response.status,
    );
  }

  return response;
};

module.exports = { befores: [], afters: [handleBadResponses] };
