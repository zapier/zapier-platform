import { describe, expect, it } from 'vitest';
import zapier from 'zapier-platform-core';

import App from '../index.js';
const appTester = zapier.createAppTester(App);

describe('custom auth', () => {
  it('passes authentication and returns json', async () => {
    const bundle = {
      authData: {
        apiKey: 'secret',
      },
    };

    const response = await appTester(App.authentication.test, bundle);
    expect(response.data).toHaveProperty('username');
  });

  it('fails on bad auth', async () => {
    const bundle = {
      authData: {
        apiKey: 'bad',
      },
    };

    try {
      await appTester(App.authentication.test, bundle);
    } catch (error) {
      expect(error.message).toContain('The API Key you supplied is incorrect');
      return;
    }
    throw new Error('appTester should have thrown');
  });
});
