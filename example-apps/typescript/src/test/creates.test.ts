/* globals describe, expect, test */

import { createAppTester, tools } from 'zapier-platform-core';

import App from '../index';

const appTester = createAppTester(App);
tools.env.inject();

describe('movie', () => {
  test('create a movie', async () => {
    const bundle = { inputData: { title: 'hello', year: 2020 } };
    const result = await appTester(App.creates.movie.operation.perform, bundle);
    expect(result).toMatchObject({
      title: 'hello',
      year: 2020,
    });
  });

  test('create movies in bulk', async () => {
    const genre = 'Genre Test';
    const idem1 = 'test-id-xxx';
    const idem2 = 'test-id-yyy';
    const idem3 = 'test-id-zzz';

    const bulkBundle = {
      bulk: [
        {
          inputData: { genre, title: 'Title 1', year: 2020 },
          meta: { id: idem1 },
        },
        {
          inputData: { genre, title: 'Title 2', year: 2021 },
          meta: { id: idem2 },
        },
        {
          inputData: { genre, title: 'Title 3', year: 2022 },
          meta: { id: idem3 },
        },
      ],
      groupedBy: { genre },
    };

    const result = await appTester(App.creates.movies.operation.performBulk, bulkBundle);
    expect(result).toMatchObject({
      idem1: {
        outputData: { genre, id: '1', title: 'Title 1', year: 2020 },
        error: null,
      },
      idem2: {
        outputData: { genre, id: '2', title: 'Title 2', year: 2021 },
        error: null,
      },
      idem3: {
        outputData: { genre, id: '3', title: 'Title 3', year: 2022 },
        error: null,
      },
    });
  });
});
