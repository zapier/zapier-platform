import { createAppTester, tools } from 'zapier-platform-core';
import { describe, test, expect } from 'vitest';

import App from '../index';

const appTester = createAppTester(App);
tools.env.inject();

describe('movie', () => {
  test('list movies', async () => {
    const bundle = { inputData: {}, authData: { access_token: 'a_token' } };
    const results = (await appTester(
      App.triggers.movie.operation.perform,
      bundle
    )) as Array<object>;

    expect(results.length).toBeGreaterThan(0);

    const firstMovie = results[0];
    expect(firstMovie).toMatchObject({
      id: '1',
      title: 'title 1',
    });
  });
});
