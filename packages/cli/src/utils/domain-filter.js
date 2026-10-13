const { callAPI } = require('./api');

const getDomainFilter = async (app, version) => {
  if (!app.all_versions.includes(version)) {
    throw new Error(
      `Version ${version} doesn't exist on integration "${app.title}"`,
    );
  }
  return (
    (await callAPI(`/apps/${app.id}/versions/${version}`)).domain_filter || ''
  );
};

// Gated server-side by the `cli_admin_domain_filter` switch; until it is on for
// the user, non-staff get a 401.
const setDomainFilter = async (app, version, domainFilter) => {
  try {
    const appVersion = await callAPI(
      `/apps/${app.id}/versions/${version}/domain-filter`,
      { method: 'POST', body: { domain_filter: domainFilter } },
      true,
    );
    return appVersion.domain_filter || '';
  } catch (e) {
    if (e.status === 401) {
      throw new Error(
        'Your account cannot set the domain filter yet. Ask Zapier to enable it.',
      );
    }
    // callAPI throws the Response itself, with `errText` set, for non-JSON errors.
    throw new Error((e.json?.errors || [e.errText || e.message]).join('\n'));
  }
};

// Keeps the current hosts first and skips ones already there.
const appendHosts = (current, hosts) =>
  [...new Set([...current.split(','), ...hosts].map((h) => h.trim()))]
    .filter(Boolean)
    .join(',');

module.exports = { appendHosts, getDomainFilter, setDomainFilter };
