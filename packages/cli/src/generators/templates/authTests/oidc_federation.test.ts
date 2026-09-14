import { describe, expect, it } from 'vitest';
import zapier from 'zapier-platform-core';

import App from '../index.js';
const appTester = zapier.createAppTester(App);

describe('oidc federation auth app', () => {
  it('fetches federation credentials via perform', async () => {
    const bundle = {
      authData: {
        region: 'us-east-1',
        roleArn: 'arn:aws:iam::123456789012:role/example',
        sessionName: 'zapier',
      },
    };

    const newAuthData = await appTester(
      App.authentication.oidcFederationConfig.perform,
      bundle,
    );

    expect(newAuthData.accessKeyId).toBe('AKIAEXAMPLE');
    expect(newAuthData.secretAccessKey).toBe(
      'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    );
    expect(newAuthData.sessionToken).toBe('EXAMPLE_SESSION_TOKEN');
  });

  it('can make an authenticated test request', async () => {
    const bundle = {
      authData: {
        accessKeyId: 'AKIAEXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        sessionToken: 'EXAMPLE_SESSION_TOKEN',
      },
    };

    const response = await appTester(App.authentication.test, bundle);

    expect(response.status).toBe(200);
  });
});
