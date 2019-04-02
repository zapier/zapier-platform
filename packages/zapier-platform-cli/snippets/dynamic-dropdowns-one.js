//...
issue: {
  key: 'issue',
  //...
  create: {
    //...
    operation: {
      inputFields: [
        {
          key: 'project_id',
          required: true,
          label: 'This is a dynamic dropdown',
          dynamic: 'project.id.name'
        }, // will call the trigger with a key of project
        {
          key: 'title',
          required: true,
          label: 'Title',
          helpText: 'What is the name of the issue?'
        }
      ]
    }
  }
}
