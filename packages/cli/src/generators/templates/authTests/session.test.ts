import { describe, expect, it } from 'vitest';
import zapier from 'zapier-platform-core';

import App from '../index.js';
const appTester = zapier.createAppTester(App);

describe('session auth app', () => {
  it('has an exchange for username/password', async () => {
    const bundle = {
      authData: {
        username: 'bryan',
        password: 'hunter2',
      },
    };

    const newAuthData = await appTester(
      App.authentication.sessionConfig.perform,
      bundle
    );

    expect(newAuthData.sessionKey).toBe('secret');
  });

  it('has auth details added to every request', async () => {
    const bundle = {
      authData: {
        sessionKey: 'secret',
      },
    };

    const response = await appTester(App.authentication.test, bundle);

    expect(response.status).toBe(200);
    expect(response.request.headers['X-API-Key']).toBe('secret');
  });
});
