const { extractID } = require('../utils');

// Fetches a list of records from the endpoint
const perform = async (z, bundle) => {
  // Ideally, we should poll through all the pages of results, but in this
  // example we're going to omit that part. Thus, this trigger only "see" the
  // people in their first page of results.
  const response = await z.request({ url: 'https://swapi.info/api/people/' });
  let peopleArray = response.data;

  if (bundle.inputData.species_id) {
    // The Zap's setup has requested a specific species of person. Since the
    // API/endpoint can't perform the filtering, we'll perform it here, within
    // the integration, and return the matching objects/records back to Zapier.
    peopleArray = peopleArray.filter((person) => {
      let speciesID;
      if (!person.species || !person.species.length) {
        speciesID = 1; // Assume human if species is not provided
      } else {
        speciesID = extractID(person.species[0]);
      }
      return speciesID === bundle.inputData.species_id;
    });
  }

  return peopleArray.map((person) => {
    person.id = extractID(person.url);
    return person;
  });
};

module.exports = {
  key: 'people',
  noun: 'person',
  display: {
    label: 'New Person',
    description: 'Triggers when a new person is added.',
  },

  operation: {
    inputFields: [
      {
        key: 'species_id',
        type: 'integer',
        helpText: 'Species of person',
        dynamic: 'species.id.name',
        altersDynamicFields: true,
      },
    ],
    perform,
    sample: {
      id: '1',
      name: 'Luke Skywalker',
      birth_year: '19 BBY',
      eye_color: 'Blue',
      gender: 'Male',
      hair_color: 'Blond',
      height: '172',
      mass: '77',
      skin_color: 'Fair',
      created: '2014-12-09T13:50:51.644000Z',
      edited: '2014-12-10T13:52:43.172000Z',
    },
  },
};
