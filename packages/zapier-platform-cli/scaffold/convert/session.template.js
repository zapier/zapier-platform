{
  // TODO: just an example stub - you'll need to complete
  type: 'session',
  test: AuthTest.operation.perform,
  fields: [
    <%= FIELDS %>
  ],
  sessionConfig: {
    perform: getSessionKey
  },
  connectionLabel: '<%= CONNECTION_LABEL %>'
}
