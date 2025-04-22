<% if (hasAuth) { %>
import {
    config as authentication,
    befores = [],
    afters = [],
} from './authentication';
<% } %>

import packageJson from './package.json' with { type: 'json' };
import zapier from '<%= corePackageName %>';

export default {
    // This is just shorthand to reference the installed dependencies you have.
    // Zapier will need to know these before we can upload.
    version: packageJson.version,
    platformVersion: zapier.version,

    <% if (hasAuth) { %>
    authentication,

    beforeRequest: [...befores],

    afterResponse: [...afters],
    <% } %>

    // If you want your trigger to show up, you better include it here!
    triggers: {},

    // If you want your searches to show up, you better include it here!
    searches: {},

    // If you want your creates to show up, you better include it here!
    creates: {},

    resources: {},
};
