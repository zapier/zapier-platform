const { callAPI } = require('./api');

// Gated server-side by the `cli_admin_domain_filter` switch; until it is on for
// the user, non-staff get a 401.
const writeDomainFilter = async (command, version, domainFilter) => {
  command.throwForInvalidVersion(version);
  const app = await command.getWritableApp();
  if (!app.all_versions.includes(version)) {
    command.error(
      `Version ${version} doesn't exist on integration "${app.title}"`,
    );
  }

  try {
    const appVersion = await callAPI(
      `/apps/${app.id}/versions/${version}/domain-filter`,
      { method: 'POST', body: { domain_filter: domainFilter } },
      true,
    );
    return appVersion.domain_filter || '';
  } catch (e) {
    if (e.status === 401) {
      command.error(
        'Your account cannot set the domain filter yet. Ask Zapier to enable it.',
      );
    }
    // callAPI throws the Response itself, with `errText` set, for non-JSON errors.
    command.error((e.json?.errors || [e.errText || e.message]).join('\n'));
  }
};

module.exports = { writeDomainFilter };
