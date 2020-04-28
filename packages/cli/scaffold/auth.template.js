${ test }

const handleBadResponses = (response, z, bundle) => {
  if (response.status === 401) {
    throw new z.errors.Error(
      // This message is surfaced to the user
      'The ${ suppliedItem } you supplied is incorrect',
      'AuthenticationError',
      response.status
    );
  }
  return response;
};

module.exports = {
  config: {
    type: '${ authType }',

    // The test method allows Zapier to verify that the credentials a user provides are valid.
    // We'll execute this method whenver a user connects their account for the first time.
    test,

    // this can be a "{{string}}" or a function
    connectionLabel: '{{bundle.inputData.username}}'
  },

  befores: [],
  afters: [handleBadResponses]
};
