// We recommend writing your creates separate like this and rolling them
// into the App definition at the end.
module.exports = {
  key: 'prediction',

  // You'll want to provide some helpful display labels and descriptions
  // for users. Zapier will put them into the UX.
  noun: 'Prediction',
  display: {
    label: 'Create Prediction',
    description: 'Creates a new prediction.',
  },

  // `operation` is where the business logic goes.
  operation: {
    inputFields: [
      {
        key: 'question',
        required: true,
        type: 'string',
        helpText: 'Provide a "Yes" or "No" question to ask the Magic 8-Ball.',
      },
    ],
    perform: (z, bundle) => {
      const promise = z.request({
        url: 'https://auth-json-server.zapier-staging.com/magic',
        method: 'POST',
        body: {
          callbackUrl: z.generateCallbackUrl(),
        },
        headers: {
          'content-type': 'application/json',

          // This is NOT how you normally do authentication. This is just to demo how to write a create here.
          // Refer to this doc to set up authentication:
          // https://docs.zapier.com/platform/reference/cli-docs#authentication
          'X-API-Key': 'secret',
        },
      });

      return promise.then((response) => ({ ...response.data, extra: 'data' }));
    },

    performResume: (z, bundle) => {
      // The original output from perform is available in bundle.outputData.
      // The data POSTed to the callbackUrl is in bundle.cleanedRequest.
      // The full request object corresponding to bundle.cleanedRequest can be found in bundle.rawRequest.
      const { extra, ...originalOutput } = bundle.outputData;
      // The following line will return an object containing the contents of the original API response to the
      // request from the perform function merged with the contents of the new request from the API.
      return { ...originalOutput, ...bundle.cleanedRequest };
    },

    // In cases where Zapier needs to show an example record to the user, but we are unable to get a live example
    // from the API, Zapier will fallback to this hard-coded sample. It should reflect the data structure of
    // returned records, and have obviously dummy values that we can show to any user.
    sample: {
      callbackUrl: 'http://zapier.com/hooks/catch/-1234/abcdef/',
      status: 'success',
      result: 'Ask again later.',
    },

    // If the resource can have fields that are custom on a per-user basis, define a function to fetch the custom
    // field definitions. The result will be used to augment the sample.
    // outputFields: () => { return []; }
    // Alternatively, a static field definition should be provided, to specify labels for the fields
    outputFields: [
      { key: 'callbackUrl', label: 'Callback URL' },
      { key: 'status', label: 'Status' },
      { key: 'result', label: 'Predicted Result' },
    ],
  },
};
