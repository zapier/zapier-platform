const generateID = require('../utils').generateID;

// fetches a list of records from the endpoint
const fetchList = (z, bundle) => {

  const request = {
    url: 'http://swapi.co/api/species/',
    params: {}
  };

  // this API returns things in "pages" of results
  if (bundle.meta.page) {
    request.params.page = 1 + bundle.meta.page;
  }

  return z.request(request)
    .then((response) => {
      var speciesArray = JSON.parse(response.content).results;
      speciesArray.forEach( (species) => {
        // copy the "url" field into an "id" field
        species.id = generateID(species.url);
      });
      return speciesArray;
    });
};

module.exports = {
  key: 'species',
  noun: 'Species',
  display: {
    label: 'List of Species',
    description: 'This is a hidden trigger, and is used in a Dynamic Dropdown within this app',
    hidden: true,
  },

  operation: {
    // since this is a "hidden" trigger, there aren't any inputFields needed
    perform: fetchList,
    // the folowing is a "hint" to the Zap Editor that this trigger returns data "in pages", and
    //   that the UI should display an option to "load next page" to the human.
    canPaginate: true
  },

};
