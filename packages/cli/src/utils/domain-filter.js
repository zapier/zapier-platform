const { callAPI } = require('./api');

const getDomainFilter = async (app, version) =>
  (await callAPI(`/apps/${app.id}/versions/${version}`)).domain_filter || '';

// Keeps the current hosts first and skips ones already there.
const appendHosts = (current, hosts) =>
  [...new Set([...current.split(','), ...hosts].map((h) => h.trim()))]
    .filter(Boolean)
    .join(',');

// Gated server-side by the `cli_admin_domain_filter` switch; until it is on for
// the user, non-staff get a 401. `nextFilter(previous)` builds the value to save.
const writeDomainFilter = async (command, version, nextFilter) => {
  command.throwForInvalidVersion(version);
  const app = await command.getWritableApp();
  if (!app.all_versions.includes(version)) {
    command.error(
      `Version ${version} doesn't exist on integration "${app.title}"`,
    );
  }

  const previous = await getDomainFilter(app, version);
  try {
    const appVersion = await callAPI(
      `/apps/${app.id}/versions/${version}/domain-filter`,
      { method: 'POST', body: { domain_filter: nextFilter(previous) } },
      true,
    );
    return { previous, stored: appVersion.domain_filter || '' };
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

module.exports = { appendHosts, getDomainFilter, writeDomainFilter };
