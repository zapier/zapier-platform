/*eslint no-unused-vars: 0 */
const path = require('path');
const colors = require('colors');

const utils = require('../utils');

const defaultPort = 7545;

// TODO: would be nice to have a /tmp/zapier-watch.pid
const watch = (context) => {
  context.line('Watching and running your app locally. Zapier will tunnel JS calls here.\n');

  const options = {
    log: context.line,
    port: context.argOpts.port || defaultPort,
  };

  let localAppId, localProxyUrl, localDefinition;
  const orgVersion = require(path.join(process.cwd(), 'package.json')).version;

  const resetHandler = () => {
    return new Promise((resolve) => {
      options.handler = utils.getLocalAppHandler({
        reload: true,
        baseEvent: {
          logToStdout: true
        }
      });
      resolve();
    });
  };
  resetHandler();

  const pingZapierForTunnel = () => {
    if (!localProxyUrl) { return Promise.resolve(); }
    const url = `/apps/${localAppId}/versions/${orgVersion}/tunnel`;
    return utils.callAPI(url, {method: 'PUT', body: {
      url: localProxyUrl,
      definition: localDefinition || {},
    }});
  };

  const reloadDefinition = () => {
    return new Promise((resolve, reject) => {
      options.handler({command: 'definition'}, {}, (err, resp) => {
        if (err) { return reject(err); }
        const currentDefinition = resp.results;
        if (currentDefinition.version !== orgVersion) {
          context.line(colors.yellow(`  Warning! Version changed from ${orgVersion} to ${currentDefinition.version}! You need to restart watch to do that.`));
        } else {
          localDefinition = currentDefinition;
        }
        return resolve(currentDefinition);
      });
    });
  };
  reloadDefinition();

  utils.nodeWatch(process.cwd(), {}, (filePath) => {
    const fileName = filePath.replace(process.cwd() + path.sep, '');
    if (fileName.startsWith('.git')) { return; }
    utils.printStarting(`Reloading for ${fileName}`);
    resetHandler()
      .then(reloadDefinition)
      .then(pingZapierForTunnel)
      .then(() => utils.printDone())
      .catch((err) => {
        utils.printDone(false);
        context.line(err);
        // don't print err.stack until we use require('syntax-error') or similar
      });
  });

  // TODO: check we've pushed the current versions.

  return utils.checkCredentials()
    .then(() => utils.getLinkedApp())
    .then((app) => {
      utils.printStarting('Starting local server on port ' + options.port);
      return Promise.all([
        app,
        utils.localAppTunnelServer(options)
      ]);
    })
    .then(([app, server]) => {
      utils.printDone();
      utils.printStarting('Starting local tunnel for port ' + options.port);
      return Promise.all([
        app,
        server,
        utils.makeTunnelUrl(options.port)
      ]);
    })
    .then(([app, server, _proxyUrl]) => {
      utils.printDone();

      localAppId = app.id;
      localProxyUrl = _proxyUrl;

      context.line();
      context.line('Running! Make changes local and you should see them reflect almost instantly in the Zapier editor.');
      context.line();

      // We must ping Zapier with the new deets a minimum of every 15 seconds.
      return utils.promiseForever(pingZapierForTunnel, 15000);
    });
};
watch.hide = true;
watch.argsSpec = [];
watch.argOptsSpec = {
  port: {help: 'what port should we host/listen for tunneling', default: defaultPort},
};
watch.help = 'Watch the current directory and send changes live to Zapier.';
watch.example = 'zapier watch';
watch.docs = `\
This command watches the current directory and, on changes, does two things:

* Sends any new changes to Zapier, instantly updating the UI in your Zapier editor.
* Tunnels all Javascript calls through your local environment with logs to stdout.

This makes for a great development experience, letting you make and observe changes much faster than a \`zapier push\`

> Note: this is only temporary and has no effect on other users at Zapier! You'll want to do \`zapier push\` to make your changes permanent and universal.

**Arguments**

${utils.argsFragment(watch.argsSpec)}
${utils.argOptsFragment(watch.argOptsSpec)}

${'```'}bash
$ zapier watch --port=9090
# Watching and running your app locally. Zapier will tunnel JS calls here.
#
#   Starting local server on port 9090 - done!
#   Starting local tunnel for port 9090 - done!
#
# Running! Make changes local and you should see them reflect almost instantly in the Zapier editor.
#
#   Reloading for index.js - done!
#   Reloading for resources/form.js - done!
#   Reloading for index.js - done!
${'```'}
`;

module.exports = watch;
