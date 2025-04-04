const { extractID } = require('../utils');

// Fetches a list of records from the endpoint
const perform = async (z, bundle) => {
  const request = {
    url: 'https://swapi.info/api/species/',
    params: {},
  };

  // This API returns things in "pages" of results
  if (bundle.meta.page) {
    request.params.page = 1 + bundle.meta.page;
  }

  const response = await z.request(request);
  const speciesArray = response.data;
  return speciesArray.map((species) => {
    species.id = extractID(species.url);
    return species;
  });
};

module.exports = {
  key: 'species',
  noun: 'Species',
  display: {
    label: 'List of Species',
    description:
      'This is a hidden trigger, and is used in a Dynamic Dropdown of another trigger.',
    hidden: true,
  },

  operation: {
    // Since this is a "hidden" trigger, there aren't any inputFields needed
    perform,
    // The folowing is a "hint" to the Zap Editor that this trigger returns data
    // "in pages", and that the UI should display an option to "load more" to
    // the human.
    canPaginate: true,
  },
};
