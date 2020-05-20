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
});
