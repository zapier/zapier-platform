const App = {
  // ...
  triggers: {
    new_project: {
      key: 'project',
      noun: 'Project',
      // `display` controls the presentation in the Zapier Editor
      display: {
        label: 'New Project',
        description: 'Triggers when a new project is added.',
        hidden: true,
      },
      operation: {
        perform: projectListRequest,
      },
    },
    another_trigger: {
      // Another trigger definition...
    },
  },
};
