const { generateID } = require("../utils");

// fetches a list of records from the endpoint
const fetchList = (z, bundle) => {
  const request = {
    url: "http://swapi.co/api/people/"
  };

  // ideally, we should poll through all the pages of results, but in this example
  //   we're going to omit that part. Thus, this trigger only "see" the people
  //   in their first page of results
  return z.request(request).then(response => {
    let peopleArray = JSON.parse(response.content).results;
    if (bundle.inputData.species) {
      // The Zap's setup has requested a specific species of person.
      // Since the API/endpoint can't perform the filtering, we'll perform it
      //   here, within the integration, and return the matching objects/records
      //   back to Zapier.
      peopleArray = peopleArray.filter(person => {
        const speciesID = generateID(person.species[0]);
        return speciesID === String(bundle.inputData.species);
      });
    }

    peopleArray.forEach(person => {
      // copy the "url" field into an "id" field
      person.id = generateID(person.url);
    });

    return peopleArray;
  });
};

module.exports = {
  key: "people",
  noun: "person",
  display: {
    label: "New Person",
    description: "Triggers when a new person is added."
  },

  operation: {
    inputFields: [
      {
        key: "species",
        type: "string",
        helpText: "Species of person",
        dynamic: "species.id.name",
        altersDynamicFields: true
      },
      (z, bundle) => {
        if (!bundle.inputData.species) {
          return [];
        }
        return [
          {
            key: "foo1",
            label: "Favorite Number",
            required: false,
            type: "number"
          },
          {
            key: "foo2",
            label: "Favorite Color",
            required: false,
            type: "string"
          }
        ];
      }
    ],
    perform: fetchList,
    sample: {
      id: "1",
      name: "Luke Skywalker",
      birth_year: "19 BBY",
      eye_color: "Blue",
      gender: "Male",
      hair_color: "Blond",
      height: "172",
      mass: "77",
      skin_color: "Fair",
      created: "2014-12-09T13:50:51.644000Z",
      edited: "2014-12-10T13:52:43.172000Z"
    }
  }
};
