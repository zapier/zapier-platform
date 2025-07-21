import { describe, expect, it } from 'vitest';
import zapier from 'zapier-platform-core';

import App from '../index.js';
const appTester = zapier.createAppTester(App);

describe('digest auth', () => {
  it('correctly authenticates', async () => {
    // Try changing the values of username or password to see how the test method behaves
    const bundle = {
      authData: {
        username: 'myuser',
        password: 'mypass',
      },
    };

    const response = await appTester(App.authentication.test, bundle);

    expect(response.status).toBe(200);
    expect(response.data.authorized).toBe(true);
    expect(response.data.user).toBe('myuser');
  });

  it('fails on bad auth', async () => {
    // Try changing the values of username or password to see how the test method behaves
    const bundle = {
      authData: {
        username: 'user',
        password: 'badpwd',
      },
    };

    try {
      await appTester(App.authentication.test, bundle);
    } catch (err) {
      expect(err.message).toContain(
        'The username and/or password you supplied is incorrect'
      );
      return;
    }
    throw new Error('appTester should have thrown');
  });
});
