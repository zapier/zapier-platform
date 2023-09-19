const authentication = {
  type: 'custom',
  test: {
    url: 'https://{{bundle.authData.subdomain}}.example.com/api/accounts/me.json',
  },
  customConfig: {
    sendCode: {
      method: 'POST',
      url: 'https://{{bundle.inputData.subdomain}}.example.com/api/otp/send',
      headers: {
        Authorization: `Bearer {{process.env.API_KEY}}`,
      },
      body: {
        to_phone_number: '{{bundle.inputData.phone_number}}',
        code: '{{bundle.inputData.code}}',
      },
    },
    // If you need any fields upfront, put them here
    fields: [
      {
        key: 'subdomain',
        type: 'string',
        required: true,
        label: 'Subdomain',
        helpText: 'The subdomain for your account.',
      },
      {
        key: 'to_phone_number',
        type: 'string',
        required: true,
        label: 'Phone Number',
        helpText: 'Your phone number. US and UK only.',
      },
    ],
  },
};

const App = {
  // ...
  authentication,
  // ...
};

module.exports = App;
