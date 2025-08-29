const sampleExportVarIndexJs = `
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

const sampleExportObjectIndexJs = `
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

const sampleExportDeclaredIndexTs = `
import type { App } from 'zapier-platform-core';
import { version as platformVersion } from 'zapier-platform-core';

import packageJson from '../package.json';
import CryptoCreate from './creates/crypto';
import BlahTrigger from './triggers/blah';

// comment!
const App: App = {
  version: packageJson.version,
  platformVersion,
  triggers: {
    [BlahTrigger.key]: BlahTrigger
  },
  creates: {
    [CryptoCreate.key]: CryptoCreate
  }
};

export default app;
`.trim();

const sampleExportDirectIndexTs = `
import type { App } from 'zapier-platform-core';
import { version as platformVersion } from 'zapier-platform-core';

import packageJson from '../package.json';
import CryptoCreate from './creates/crypto';
import BlahTrigger from './triggers/blah';

// comment!
export default {
  version: packageJson.version,
  platformVersion,
  triggers: {
    [BlahTrigger.key]: BlahTrigger
  },
  creates: {
    [CryptoCreate.key]: CryptoCreate
  }
} satisfies App;
`.trim();

const sampleShorthandIndexTs = `
import type { App } from 'zapier-platform-core';
import { version as platformVersion } from 'zapier-platform-core';
import * as creates from './creates/index.js';

import packageJson from '../package.json';

// comment!
export default {
  version: packageJson.version,
  platformVersion,
  creates
} satisfies App;
`.trim();

const sampleShorthandIndexJs = `
const creates = require('./creates/index.js');

const App = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,
  creates
};

module.exports = App;
`.trim();

const sampleLegacyAppIndexJs = `
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

const sampleAppWithSpreadIndexJs = `
const CryptoCreate = require('./creates/crypto')
const BlahTrigger = require('./triggers/blah')
const packageJson = require('./package.json')
const zapier = require('zapier-platform-core')

const someStuff = {
  version: packageJson.version,
  platformVersion: zapier.version
}

// comment!
module.exports = {
  ...someStuff,
  triggers: {
    [BlahTrigger.key]: BlahTrigger
  },
  creates: {
    [CryptoCreate.key]: CryptoCreate
  }
}
`.trim();

const sampleAppWithSpreadIndexTs = `
import type { App } from 'zapier-platform-core';
import { version as platformVersion } from 'zapier-platform-core';

import packageJson from '../package.json';
import CryptoCreate from './creates/crypto';
import BlahTrigger from './triggers/blah';

const someStuff = {
  version: packageJson.version
}

// comment!
export default {
  ...someStuff,
  platformVersion,
  triggers: {
    [BlahTrigger.key]: BlahTrigger
  },
  creates: {
    [CryptoCreate.key]: CryptoCreate
  }
} satisfies App;
`.trim();

module.exports = {
  sampleExportVarIndexJs,
  sampleExportObjectIndexJs,
  sampleExportDeclaredIndexTs,
  sampleExportDirectIndexTs,
  sampleShorthandIndexTs,
  sampleShorthandIndexJs,
  sampleLegacyAppIndexJs,
  sampleAppWithSpreadIndexJs,
  sampleAppWithSpreadIndexTs,
};
