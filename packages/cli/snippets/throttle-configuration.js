const App = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  // default throttle used for each action
  throttle: {
    window: 600,
    limit: 50,
    scope: ['account'],
  },

  creates: {
    upload_video: {
      noun: 'Video',
      display: {
        label: 'Upload Video',
        description: 'Upload a video.',
      },
      operation: {
        perform: () => {},
        inputFields: [{key: 'name', required: true, type: 'string'}],
        // overwrites the default, for this action
        throttle: {
          window: 600,
          limit: 5,
          key: 'test-key-{{bundle.inputData.name}}',
          scope: ['account'],
          overrides: [
            {
              window: 600,
              limit: 10,
              filter: 'free',
              retry: false,
            },
            {
              window: 600,
              limit: 100,
              filter: 'trial',
              retry: false,
            },
            {
              window: 0,
              limit: 0,
              filter: 'paid',
              retry: true,
            },
          ],
        },
      },
    },
  },
};

module.exports = App;
