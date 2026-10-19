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
// the user, non-staff get a 401. With `append`, the server adds the domains to the
// stored filter, so two people appending at once don't overwrite each other.
const setDomainFilter = async (app, version, domainFilter, { append } = {}) => {
  const body = { domain_filter: domainFilter, ...(append && { append: true }) };
  try {
    const appVersion = await callAPI(
      `/apps/${app.id}/versions/${version}/domain-filter`,
      { method: 'POST', body },
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

module.exports = { getDomainFilter, setDomainFilter };
