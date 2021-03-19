const ItemResource = {
  key: 'item',
  noun: 'Item',
  list: {
    display: {
      description: 'This is a description',
    },
    operation: {
      perform: {
        url: 'https://example.com',
      },
      inputFields: [
        { key: 'integer' },
        { key: 'test', type: 'string' },
        { key: 'whatever', dynamic: 'thing.id.cat' },
      ],
    },
  },
  search: {
    display: {
      description: 'This is a description',
    },
    operation: {
      perform: () => {},
      inputFields: () => {},
    },
  },
};

const PingResource = {
  key: 'ping',
  noun: 'Ping',
  hook: {
    display: {
      description: 'This is a description for a static hook.',
    },
    operation: {
      perform: () => {},
    },
  },
};

const SubPingResource = {
  key: 'subping',
  noun: 'Sub Ping',
  hook: {
    display: {
      description: 'This is a description for a sub hook.',
    },
    operation: {
      perform: () => {},
      performSubscribe: {
        method: 'POST',
        url: 'https://example.com/api/subscribe',
        body: {
          url: '{{subscriptionUrl}}',
        },
      },
      performUnsubscribe: () => {},
    },
  },
};

const Lead = {
  key: 'lead',
  noun: 'Lead',
  list: {
    display: {
      label: 'New Lead',
      description: 'Triggers on any new lead in the project.',
    },
    operation: {
      // polling is implied
      canPaginate: true,
      perform: function () {},
    },
  },
};

const ExtraTrigger = {
  key: 'new_lead_project',
  noun: 'Lead',
  // automatic?
  display: {
    // no effect on behavior
    label: 'New Lead in Project',
    description: 'Triggers when a lead is added to a project.',
    important: false,
    hidden: false,
    order: 3,
  },
  operation: {
    // behavioral effects
    type: 'polling', // staticHook, subscription
    // if subscription - we find other resources and do polls there?
    resource: Lead.key,
    canPaginate: false,
    perform: function () {},
    // performSubscribe
    // performUnsubscribe
    inputFields: [{ key: 'project_name' }],
    outputFields: [],
    sample: { id: 123 },
    // flags?
  },
};

module.exports = {
  title: 'Example App',
  description: 'This is an app that is an example of what you can validate',
  version: '1.2.3',
  platformVersion: '3.0.0',
  resources: {
    [ItemResource.key]: ItemResource,
    [PingResource.key]: PingResource,
    [SubPingResource.key]: SubPingResource,
    [Lead.key]: Lead,
  },
  triggers: {
    [ExtraTrigger.key]: ExtraTrigger,
  },
};
