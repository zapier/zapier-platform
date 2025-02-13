const { API_URL } = require('./constants');
// You want to make a request to an endpoint that is either specifically designed
// to test auth, or one that every user will have access to. eg: `/me`.
// By returning the entire request object, you have access to the request and
// response data for testing purposes. Your connection label can access any data
// from the returned response using the `json.` prefix. eg: `{{json.username}}`.
const test = (z, bundle) =>
  z.request({ url: `${API_URL}/me` });



module.exports = {
  // "custom" is the catch-all auth type. The user supplies some info and Zapier can
  // make authenticated requests with it
  type: 'custom',

  // Define any input app's auth requires here. The user will be prompted to enter
  // this info when they connect their account.
  fields: [
    {
      key: 'api_key',
      label: 'API Key',
      required: true,
      helpText:
        'Generate an API Key in your [Platform settings page](https://platform.openai.com/api-keys).',
    },
    // This field is optional and can be removed if not needed
    {
      key: 'organization_id',
      required: false,
      label: 'Organization ID',
      helpText:
        '**Optional** Only required if your OpenAI account belongs to multiple organizations. If not using OpenAI, this field will be disregarded. If your OpenAI account belongs to multiple organizations, optionally add the [Organization ID](https://platform.openai.com/account/org-settings) that this connection should use. If left blank, your [default organization](https://platform.openai.com/account/api-keys) will be used.',
    },
  ],

  // The test method allows Zapier to verify that the credentials a user provides
  // are valid. We'll execute this method whenever a user connects their account for
  // the first time.
  test,

  // This template string can access all the data returned from the auth test. If
  // you return the test object, you'll access the returned data with a label like
  // `{{json.X}}`. If you return `response.data` from your test, then your label can
  // be `{{X}}`. This can also be a function that returns a label. That function has
  // the standard args `(z, bundle)` and data returned from the test can be accessed
  // in `bundle.inputData.X`.
  connectionLabel: '{{json.email}}',
};
