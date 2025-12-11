const { extractID } = require('../utils');

/**
 * PERFORM-BASED choices WITH PAGINATION (NEW pattern)
 * Fetches planets from the Star Wars API with pagination support.
 *
 * - bundle.meta.paging_token is a full URL from the previous response
 * - Return paging_token as the API's next page URL (or null if no more pages)
 *
 * MUST return: { results: [...], paging_token: string|null }
 */
const getPlanetChoices = async (z, bundle) => {
  // paging_token is a full URL to the next page (from SWAPI's "next" field)
  // First page: paging_token is undefined/null, use default URL
  const url = bundle.meta.paging_token || 'https://swapi.dev/api/planets/';

  const response = await z.request({ url });
  const data = response.data;

  // SWAPI returns: { results: [...], next: "url" or null }
  return {
    results: data.results.map((planet) => ({
      id: extractID(planet.url),
      label: planet.name,
    })),
    // Return SWAPI's next URL as our paging_token
    paging_token: data.next,
  };
};

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
      // TRIGGER-BASED dynamic dropdown (legacy pattern)
      // Uses a separate trigger to fetch choices
      {
        key: 'species_id',
        type: 'integer',
        label: 'Species (trigger-based)',
        helpText:
          'Filter by species. Uses trigger-based dynamic dropdown (dynamic: "species.id.name").',
        dynamic: 'species.id.name',
        altersDynamicFields: true,
      },
      // PERFORM-BASED dynamic dropdown WITH PAGINATION (new pattern)
      // Uses a function to fetch choices directly
      {
        key: 'planet_id',
        type: 'integer',
        label: 'Home Planet (perform-based)',
        helpText:
          'Filter by home planet. Uses perform-based dynamic dropdown with pagination support.',
        choices: {
          perform: getPlanetChoices,
        },
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
