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
        inputFields: [],
        // overwrites the default, for this action
        throttle: {
          window: 600,
          limit: 5,
          scope: ['account'],
        },
      },
    },
  },
};

module.exports = App;
