const App = {
  //...
  resources: {
    project: {
      key: 'project',
      //...
      search: {
        //...
        operation: {
          perform: () => { return [{id: 123, name: 'Project 1'}]; } // called for project_id
        }
      }
    },
    issue: {
      key: 'issue',
      //...
      create: {
        //...
        operation: {
          inputFields: [
            {key: 'project_id', required: true, label: 'Project', search: 'projectSearch.id'}, // calls project.search
            {key: 'title', required: true, label: 'Title', helpText: 'What is the name of the issue?'},
          ],
        }
      }
    }
  }
};
