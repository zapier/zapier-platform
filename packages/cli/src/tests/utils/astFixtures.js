const sampleExportVarIndex = `
const CryptoCreate = require('./creates/crypto')
const BlahTrigger = require('./triggers/blah')
// comment!
const App = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,
  resources: {
  	test: () => {
      // red herring require
    	const fs = require('fs')
    }
  },
  triggers: {
    [BlahTrigger.key]: BlahTrigger
  },
  creates: {
    [CryptoCreate.key]: CryptoCreate
  }
}
module.exports = App
`.trim();

const sampleExportObjectIndex = `
const CryptoCreate = require('./creates/crypto')
const BlahTrigger = require('./triggers/blah')
// comment!
module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,
  resources: {
  	test: () => {
      // red herring require
    	const fs = require('fs')
    }
  },
  triggers: {
    [BlahTrigger.key]: BlahTrigger
  },
  creates: {
    [CryptoCreate.key]: CryptoCreate
  }
}
`.trim();

const sampleLegacyAppIndex = `
const authentication = require('./authentication');
const businessTrigger = require('./triggers/business.js');
const eventSetsTrigger = require('./triggers/event_sets.js');
const offlineEventCreate = require('./creates/offline_event.js');
const hydrators = require('./hydrators');

const fs = require('fs');
const scriptingSource = fs.readFileSync('./scripting.js', { encoding: 'utf8' });

const beforeRequest = (request, z, bundle) => {
  return z.legacyScripting.beforeRequest(request, z, bundle);
};

const afterResponse = (response, z, bundle) => {
  return z.legacyScripting.afterResponse(response, z, bundle);
};

module.exports = {
  afterResponse: [afterResponse],
  authentication: authentication,
  beforeRequest: [beforeRequest],
  creates: { [offlineEventCreate.key]: offlineEventCreate },
  hydrators: hydrators,
  legacy: {
    authentication: {
      mapping: {},
      oauth2Config: {
        accessTokenUrl: 'https://google.com',
        authorizeUrl: 'https://www.facebook.com'
      },
      placement: 'header',
      testTrigger: 'business'
    },
    creates: {
      offline_event: {
        operation: {
          fieldsExcludedFromBody: [
            'currency'
          ],
          url:
            'https://graph.facebook.com'
        }
      }
    },
    loadCustomFieldsEarly: false,
    needsFlattenedData: false,
    needsTriggerData: false,
    scriptingSource: scriptingSource,
    searches: {},
    subscribeUrl: 'https://graph.facebook.com/',
    triggers: {
      business: {
        operation: { url: 'https://graph.facebook.com/' }
      }
    }
  },
  platformVersion: require('zapier-platform-core').version,
  searches: {},
  triggers: {
    [businessTrigger.key]: businessTrigger
  },
  version: require('./package.json').version
};
`.trim();

module.exports = {
  sampleExportVarIndex,
  sampleExportObjectIndex,
  sampleLegacyAppIndex,
};
