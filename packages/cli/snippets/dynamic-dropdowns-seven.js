const App = {
  // ...
  resources: {
    project: {
      key: 'project',
      // ...
      list: {
        // ...
        operation: {
          canPaginate: true,
          perform: () => {
            if (bundle.meta.isFillingDynamicDropdown) {
              // perform pagination request here
            } else {
              return [{ id: 123, name: 'Project 1' }];
            }
          },
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
            }, // calls project.list
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
