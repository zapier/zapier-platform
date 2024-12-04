require('should');

const { makeTable } = require('../../utils/display');

describe('display', () => {
  describe('table', () => {
    it('should print a nice little table', () => {
      const originalWidth = process.stdout.columns;
      try {
        process.stdout.columns = 50;
        const table = makeTable(
          [
            { id: 123, title: 'hello' },
            { id: 456, title: 'world' },
          ],
          [
            ['ID', 'id'],
            ['Title', 'title'],
            ['Missing', 'missing'],
          ],
        );

        // Verify presence
        table.indexOf('ID').should.be.above(-1);
        table.indexOf('Title').should.be.above(-1);
        table.indexOf('Missing').should.be.above(-1);
        table.indexOf('123').should.be.above(-1);
        table.indexOf('hello').should.be.above(-1);
        table.indexOf('456').should.be.above(-1);
        table.indexOf('world').should.be.above(-1);

        // Verify order
        table.indexOf('ID').should.be.below(table.indexOf('Title'));
        table.indexOf('Title').should.be.below(table.indexOf('Missing'));
        table.indexOf('Missing').should.be.below(table.indexOf('123'));
        table.indexOf('123').should.be.below(table.indexOf('hello'));
        table.indexOf('hello').should.be.below(table.indexOf('456'));
        table.indexOf('456').should.be.below(table.indexOf('world'));
      } finally {
        process.stdout.columns = originalWidth;
      }
    });

    it('should print plain when the canvas is too small', () => {
      const originalWidth = process.stdout.columns;
      try {
        process.stdout.columns = 15;
        const table = makeTable(
          [
            { id: 123, title: 'hello' },
            { id: 456, title: 'world' },
          ],
          [
            ['ID', 'id'],
            ['Title', 'title'],
            ['Missing', 'missing'],
          ],
        );

        // Verify presence
        table.indexOf('ID').should.be.above(-1);
        table.indexOf('Title').should.be.above(-1);
        table.indexOf('Missing').should.be.above(-1);
        table.indexOf('123').should.be.above(-1);
        table.indexOf('hello').should.be.above(-1);
        table.indexOf('456').should.be.above(-1);
        table.indexOf('world').should.be.above(-1);

        // Verify order
        table.indexOf('ID').should.be.below(table.indexOf('123'));
        table.indexOf('123').should.be.below(table.indexOf('Title'));
        table.indexOf('Title').should.be.below(table.indexOf('hello'));
        table.indexOf('hello').should.be.below(table.indexOf('456'));
        table.indexOf('456').should.be.below(table.indexOf('world'));
      } finally {
        process.stdout.columns = originalWidth;
      }
    });
  });
});
