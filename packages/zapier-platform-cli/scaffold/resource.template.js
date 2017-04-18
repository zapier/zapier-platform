// get a single <%= LOWER_NOUN %>
const get<%= CAMEL %> = (z, bundle) => {
  const responsePromise = z.request({
    url: `http://example.com/api/<%= KEY %>s/${bundle.inputData.id}.json`,
  });
  return responsePromise
    .then(response => JSON.parse(response.content));
};

// get a list of <%= LOWER_NOUN %>s
const list<%= CAMEL %>s = (z) => {
  const responsePromise = z.request({
    url: 'http://example.com/api/<%= KEY %>s.json',
    params: {
      order_by: 'id desc'
    }
  });
  return responsePromise
    .then(response => JSON.parse(response.content));
};

// find a particular <%= LOWER_NOUN %> by name
const search<%= CAMEL %>s = (z, bundle) => {
  const responsePromise = z.request({
    url: 'http://example.com/api/<%= KEY %>s.json',
    params: {
      query: `name:${bundle.inputData.name}`
    }
  });
  return responsePromise
    .then(response => JSON.parse(response.content));
};

// create a <%= LOWER_NOUN %>
const create<%= CAMEL %> = (z, bundle) => {
  const responsePromise = z.request({
    method: 'POST',
    url: 'http://example.com/api/<%= KEY %>s.json',
    body: {
      name: bundle.inputData.name // json by default
    }
  });
  return responsePromise
    .then(response => JSON.parse(response.content));
};

module.exports = {
  key: '<%= KEY %>',
  noun: '<%= NOUN %>',

  get: {
    display: {
      label: 'Get <%= NOUN %>',
      description: 'Gets a <%= LOWER_NOUN %>.'
    },
    operation: {
      inputFields: [
        {key: 'id', required: true}
      ],
      perform: get<%= CAMEL %>
    }
  },

  list: {
    display: {
      label: 'New <%= NOUN %>',
      description: 'Lists the <%= LOWER_NOUN %>s.'
    },
    operation: {
      perform: list<%= CAMEL %>s
    }
  },

  search: {
    display: {
      label: 'Find <%= NOUN %>',
      description: 'Finds a <%= LOWER_NOUN %> by searching.'
    },
    operation: {
      inputFields: [
        {key: 'name', required: true}
      ],
      perform: search<%= CAMEL %>s
    },
  },

  create: {
    display: {
      label: 'Create <%= NOUN %>',
      description: 'Creates a new <%= LOWER_NOUN %>.'
    },
    operation: {
      inputFields: [
        {key: 'name', required: true}
      ],
      perform: create<%= CAMEL %>
    },
  },

  sample: {
    id: 1,
    name: 'Test'
  },

  outputFields: [
    {key: 'id', label: 'ID'},
    {key: 'name', label: 'Name'}
  ]
};
