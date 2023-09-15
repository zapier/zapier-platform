const authentication = {
  type: 'otp',
  test: {
    url: 'https://{{bundle.authData.subdomain}}.example.com/api/accounts/me.json',
  },
  // you can provide additional fields for inclusion in authData
  otpConfig: {
    // The function to call out to verify the OTP code.
    sendCode: {
      method: 'POST',
      url: 'https://{{bundle.inputData.subdomain}}.example.com/api/otp/verify',
    },
  },
  // If you need any fields upfront, put them here
  fields: [
    {
      key: 'phone_number',
      type: 'string',
      required: true,
      label: 'Phone Number',
      helpText: 'Your phone number. US and UK only.',
    },
    {
      key: 'code',
      type: 'string',
      required: true,
      label: 'Confirm PIN',
      helpText: 'The PIN sent to your phone.',
    },
  ],
};

const App = {
  // ...
  authentication,
  // ...
};

module.exports = App;
