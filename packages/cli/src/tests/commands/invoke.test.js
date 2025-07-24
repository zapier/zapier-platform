const proxyquire = require('proxyquire');
const should = require('should');

const appDefinition = {
  platformVersion: '1.0.0',
  creates: {
    action_key: {
      key: 'action_key',
      operation: {
        perform: () => ({ outputField: 'value' }),
        inputFields: [
          {
            key: 'name',
          },
          {
            key: 'age',
            type: 'integer',
          },
        ],
      },
    },
  },
};

describe('InvokeCommand', () => {
  describe('invokeAction', () => {
    describe('inputDataRaw', () => {
      it('should pass unresolved inputData as inputDataRaw', async () => {
        const inputData = { name: 'John', age: '40' };
        let localAppCommandCallCount = 0;

        const InvokeCommand = proxyquire('../../oclif/commands/invoke', {
          '../../utils/local': {
            localAppCommand: async (event) => {
              localAppCommandCallCount++;
              if (event.method === 'creates.action_key.operation.inputFields') {
                should(event.bundle.inputData).eql(inputData);
                should(event.bundle.inputDataRaw).eql(inputData);
                return appDefinition.creates.action_key.operation.inputFields;
              }

              if (event.method === 'creates.action_key.operation.perform') {
                should(event.bundle.inputData).eql({
                  name: 'John',
                  age: 40, // Resolved type
                });
                should(event.bundle.inputDataRaw).eql({
                  name: 'John',
                  age: '40', // Original value
                });
                return {
                  message: 'Hi John!',
                };
              }

              should.fail('Unexpected call to localAppCommand');
            },
          },
        });

        const command = new InvokeCommand();

        await command.invokeAction(
          appDefinition,
          'creates',
          appDefinition.creates.action_key,
          inputData,
          undefined,
          {},
          {
            isLoadingSample: false,
            isFillingDynamicDropdown: true,
            isPopulatingDedupe: false,
            limit: -1,
            page: 0,
            isTestingAuth: false,
          },
          'America/Chicago',
          {},
          {},
          123,
          'deployKey',
        );

        should(localAppCommandCallCount).eql(2);
      });
    });
  });
});
