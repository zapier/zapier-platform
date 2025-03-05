/* globals describe, expect, test */

import zapier from 'zapier-platform-core';

import App from '../../index.js';

const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

describe('trigger recipe', () => {
  test('basic case', async () => {
    const bundle = {};
    const results = await appTester(
      App.triggers.recipe.operation.perform,
      bundle,
    );

    expect(results.length).toBe(2);

    expect(results[0].id).toBe(1);
    expect(results[0].url).toBe('https://httpbin.zapier-tooling.com/get');

    expect(results[1].id).toBe(2);
    expect(results[1].slideshow.author).toBe('Yours Truly');
  });
});
