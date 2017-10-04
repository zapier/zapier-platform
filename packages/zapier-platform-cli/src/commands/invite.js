const utils = require('../utils');

const makeAccess = require('./_access');

const invite = makeAccess('invite', 'invitee');
invite.help = 'Manage the invitees/testers on your project. Can optionally specify a version or --remove.';
invite.example = 'zapier invite [user@example.com] [1.0.0]';
invite.docs = `
Invite any user registered on Zapier to test your app. Commonly, this is useful for teammates, contractors, or other team members who might want to test, QA, or view your app versions. If you'd like to provide full admin access, try \`zapier collaborate\`.

> Send an email directly, which contains a one-time use link for them only - or share the public URL to "bulk" invite folks!

**Arguments**

* _none_ -- print all invitees
${utils.argsFragment(invite.argsSpec)}
${utils.argOptsFragment(invite.argOptsSpec)}
${utils.defaultArgOptsFragment()}

${'```'}bash
$ zapier invite
# The invitees on your app listed below.

# ┌───────────────────┬──────────┬──────────┬─────────┐
# │ Email             │ Role     │ Status   │ Version │
# ├───────────────────┼──────────┼──────────┼─────────┤
# │ user@example.com  │ invitees │ accepted │ 1.0.0   │
# └───────────────────┴──────────┴──────────┴─────────┘
#
# Don't want to send individual invite emails? Use this public link and share with anyone on the web:
#
#   https://zapier.com/platform/public-invite/1/222dcd03aed943a8676dc80e2427a40d/

$ zapier invite user@example.com 1.0.0
# Preparing to add invitee user@example.com to your app "Example (1.0.0)".
#
#   Adding user@example.com - done!
#
# Invitees updated! Try viewing them with \`zapier invite\`.

$ zapier invite user@example.com --remove
# Preparing to remove invitee user@example.com from your app "Example".
#
#   Removing user@example.com - done!
#
# Invitees updated! Try viewing them with \`zapier invite\`.
${'```'}
`;

module.exports = invite;
