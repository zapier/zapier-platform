'use strict';

require('should');

const { shouldPaginate } = require('../src/tools/should-paginate');

describe('shouldPaginate', () => {
  it('should paginate a polling trigger with canPaginate', () => {
    shouldPaginate(
      {
        triggers: {
          trigger: {
            operation: {
              type: 'polling',
              perform: '$func$2$f$',
              canPaginate: true,
            },
          },
        },
      },
      'triggers.trigger.operation.perform',
    ).should.eql(true);
  });

  it('should not paginate a polling trigger without canPaginate', () => {
    shouldPaginate(
      {
        triggers: {
          trigger: {
            operation: {
              type: 'polling',
              perform: '$func$2$f$',
            },
          },
        },
      },
      'triggers.trigger.operation.perform',
    ).should.eql(false);
  });

  it('should paginate a trigger without type with canPaginate', () => {
    shouldPaginate(
      {
        triggers: {
          trigger: {
            operation: {
              perform: '$func$2$f$',
              canPaginate: true,
            },
          },
        },
      },
      'triggers.trigger.operation.perform',
    ).should.eql(true);
  });

  it('should not paginate a trigger without type without canPaginate', () => {
    shouldPaginate(
      {
        triggers: {
          trigger: {
            operation: {
              perform: '$func$2$f$',
            },
          },
        },
      },
      'triggers.trigger.operation.perform',
    ).should.eql(false);
  });

  it('should paginate a hook trigger with canPaginate for performList only', () => {
    const definition = {
      triggers: {
        trigger: {
          operation: {
            type: 'hook',
            perform: '$func$2$f$',
            performList: '$func$2$f$',
            canPaginate: true,
          },
        },
      },
    };
    shouldPaginate(
      definition,
      'triggers.trigger.operation.perform',
    ).should.equal(false);
    shouldPaginate(
      definition,
      'triggers.trigger.operation.performList',
    ).should.equal(true);
  });

  it('should not paginate a hook trigger without canPaginate', () => {
    const definition = {
      triggers: {
        trigger: {
          operation: {
            type: 'hook',
            perform: '$func$2$f$',
            performList: '$func$2$f$',
          },
        },
      },
    };
    shouldPaginate(
      definition,
      'triggers.trigger.operation.perform',
    ).should.equal(false);
    shouldPaginate(
      definition,
      'triggers.trigger.operation.performList',
    ).should.equal(false);
  });

  it('should paginate a list resource with canPaginate', () => {
    shouldPaginate(
      {
        resources: {
          resource: {
            list: {
              operation: {
                perform: '$func$2$f',
                canPaginate: true,
              },
            },
          },
        },
      },
      'resources.resource.list.operation.perform',
    ).should.eql(true);
  });

  it('should not paginate a list resource without canPaginate', () => {
    shouldPaginate(
      {
        resources: {
          resource: {
            list: {
              operation: {
                perform: '$func$2$f',
              },
            },
          },
        },
      },
      'resources.resource.list.operation.perform',
    ).should.eql(false);
  });

  it('should paginate a hook resource with canPaginate for performList only', () => {
    const definition = {
      resources: {
        resource: {
          hook: {
            operation: {
              perform: '$func$2$f$',
              performList: '$func$2$f$',
              canPaginate: true,
            },
          },
        },
      },
    };
    shouldPaginate(
      definition,
      'resources.resource.hook.operation.perform',
    ).should.equal(false);
    shouldPaginate(
      definition,
      'resources.resource.hook.operation.performList',
    ).should.equal(true);
  });

  it('should not paginate a hook resource without canPaginate', () => {
    const definition = {
      resources: {
        resource: {
          hook: {
            operation: {
              perform: '$func$2$f$',
              performList: '$func$2$f$',
            },
          },
        },
      },
    };
    shouldPaginate(
      definition,
      'resources.resource.hook.operation.perform',
    ).should.equal(false);
    shouldPaginate(
      definition,
      'resources.resource.hook.operation.performList',
    ).should.equal(false);
  });
});
