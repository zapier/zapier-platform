const _ = require('lodash');
const colors = require('colors');

const utils = require('../utils');

const makeAccess = (command, recordType) => {
  const recordTypePlural = `${recordType}s`;

  const access = (context, email, version) => {
    if (email) {
      return utils
        .checkCredentials()
        .then(() => utils.getLinkedApp())
        .then(app => {
          const urlExtra =
            version && !global.argOpts.remove ? `/${version}` : '';
          const msgExtra = version ? ` (${version})` : '';
          const url = `/apps/${app.id}/${recordTypePlural}/${email}${urlExtra}`;

          if (global.argOpts.remove) {
            context.line(
              `Preparing to remove ${recordType} ${email} from your app "${
                app.title
              }".\n`
            );
            utils.startSpinner(`Removing ${email}`);
            return utils.callAPI(url, { method: 'DELETE' });
          } else {
            context.line(
              `Preparing to add ${recordType} ${email} to your app "${
                app.title
              }${msgExtra}".\n`
            );
            utils.startSpinner(`Adding ${email}`);
            return utils.callAPI(url, { method: 'POST' });
          }
        })
        .then(() => {
          utils.endSpinner();
          context.line(
            `\n${_.capitalize(
              recordTypePlural
            )} updated! Try viewing them with \`zapier ${command}\`.`
          );
        });
    } else {
      return utils.listEndpoint(recordTypePlural).then(data => {
        context.line(
          `The ${recordTypePlural} on your app "${
            data.app.title
          }" listed below.\n`
        );
        const ifEmpty = colors.grey(
          `${_.capitalize(
            recordTypePlural
          )} not found. Try adding one with \`zapier ${command} user@example.com\`.`
        );
        const columns = [
          ['Email', 'email'],
          ['Role', 'role'],
          ['Status', 'status']
        ];

        // Invitees can get access to specific versions only
        if (recordType === 'invitee') {
          columns.push(['Version', 'app_version']);
          // Clean up "null" in app_version
          _.each(
            _.get(data, 'invitees', []),
            invitee => (invitee.app_version = invitee.app_version || 'All')
          );
        }
        utils.printData(data[recordTypePlural], columns, ifEmpty);

        if (data && data.invite_url) {
          context.line();
          context.line(
            'You can invite users to all versions of this app (current and future) using this URL:\n\n  ' +
              colors.bold(data.invite_url)
          );
        }

        if (
          data &&
          data.versions_invite_urls &&
          Object.keys(data.versions_invite_urls).length
        ) {
          context.line();
          context.line('Or you can invite users to a specific version:\n');
          _.each(data.versions_invite_urls, (invite_url, _version) => {
            context.line(`  ${_version}: ${colors.bold(invite_url)}`);
          });
        }
      });
    }
  };
  access.argsSpec = [
    {
      name: 'email',
      help: 'which user to add/remove',
      example: 'user@example.com'
    }
  ];
  access.argOptsSpec = {
    remove: { flag: true, help: 'elect to remove this user' }
  };

  // Invitees can get access to specific versions only
  if (recordType === 'invitee') {
    access.argsSpec.push({
      name: 'version',
      help: 'only invite to a specific version',
      example: '1.0.0'
    });
  }

  return access;
};

module.exports = makeAccess;
