/* globals describe, expect, test */

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

describe('triggers', () => {
  test('species', async () => {
    const bundle = {
      inputData: {},
      meta: {},
    };

    const results = await appTester(
      App.triggers.species.operation.perform,
      bundle,
    );
    expect(results.length).toBeGreaterThan(1);

    const firstSpecies = results[0];
    expect(firstSpecies.id).toBe(1);
    expect(firstSpecies.name).toBe('Human');
  });

  test('people', async () => {
    const bundle = {
      inputData: {
        species: 1,
      },
    };

    const results = await appTester(
      App.triggers.people.operation.perform,
      bundle,
    );
    expect(results.length).toBeGreaterThan(1);

    const firstPerson = results[0];
    expect(firstPerson.id).toBe(1);
    expect(firstPerson.name).toBe('Luke Skywalker');
  });
});
