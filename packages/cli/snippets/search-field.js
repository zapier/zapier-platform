const App = {
  // ...
  resources: {
    project: {
      key: 'project',
      // ...
      search: {
        // ...
        operation: {
          perform: () => {
            return [{ id: 123, name: 'Project 1' }];
          }, // called for project_id
        },
      },
    },
    issue: {
      key: 'issue',
      // ...
      create: {
        // ...
        operation: {
          inputFields: [
            {
              key: 'project_id',
              required: true,
              label: 'Project',
              dynamic: 'projectList.id.name',
              search: 'projectSearch.id',
            }, // calls project.search (requires a trigger in the "dynamic" property)
            {
              key: 'title',
              required: true,
              label: 'Title',
              helpText: 'What is the name of the issue?',
            },
          ],
        },
      },
    },
  },
};
