require("should");

const zapier = require("zapier-platform-core");

const App = require("../index");
const appTester = zapier.createAppTester(App);

describe("triggers", () => {
  describe("species hidden trigger", () => {
    it("should load species", done => {
      const bundle = {
        inputData: {},
        meta: {}
      };

      appTester(App.triggers.species.operation.perform, bundle)
        .then(results => {
          results.length.should.above(1);

          const firstSpecies = results[0];
          firstSpecies.name.should.eql("Hutt");
          firstSpecies.id.should.eql("5");

          done();
        })
        .catch(done);
    });
  });

  describe("new person trigger", () => {
    it("should load people", done => {
      const bundle = {
        inputData: {
          species: 1
        }
      };

      appTester(App.triggers.people.operation.perform, bundle)
        .then(results => {
          results.length.should.above(1);

          const firstPerson = results[0];
          firstPerson.name.should.eql("Luke Skywalker");
          firstPerson.id.should.eql("1");

          done();
        })
        .catch(done);
    });
  });
});
