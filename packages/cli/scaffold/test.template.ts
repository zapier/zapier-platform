import { describe, expect, it } from 'vitest';
import zapier from 'zapier-platform-core';

import App from '../../index';

const appTester = zapier.createAppTester(App);
// read the `.env` file into the environment, if available
zapier.tools.env.inject();

describe('<%= ACTION_PLURAL %>.<%= KEY %>', () => {
  it('should run', async () => {
    const bundle = { inputData: {} };

    const results = await appTester(App.<%= ACTION_PLURAL %>['<%= KEY %>'].<%= MAYBE_RESOURCE %>operation.perform, bundle);
    expect(results).toBeDefined();
    // TODO: add more assertions
  });
});
