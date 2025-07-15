#!/usr/bin/env node

/**
 * Example demonstrating the new console import functionality
 * This script shows how to use the standalone console import from zapier-platform-core
 */

const {
  console: zapierConsole,
  createAppTester,
} = require('zapier-platform-core');

// Example app using both z.console and the standalone console
const App = {
  version: '1.0.0',
  platformVersion: '17.3.0',

  triggers: {
    example: {
      key: 'example',
      noun: 'Example',
      display: {
        label: 'Example Trigger',
        description: 'An example trigger to test console functionality',
      },
      operation: {
        perform: (z, bundle) => {
          // Traditional z.console usage
          z.console.log('Using z.console - this is the traditional way');
          z.console.error('z.console error message');

          // Standalone console import usage (this is the new feature!)
          zapierConsole.log(
            'Using standalone console import - this is the new way!',
          );
          zapierConsole.warn('Standalone console warning message');

          return [{ id: 1, message: 'Example data' }];
        },
      },
    },
  },
};

async function main() {
  console.log('=== Zapier Platform Core Console Import Demo ===\n');

  console.log(
    '1. Testing standalone console BEFORE middleware initialization:',
  );
  console.log(
    '   (These should be no-ops and not output anything to the logs)',
  );
  zapierConsole.log('This message should not appear in logs (no-op)');
  zapierConsole.error('This error should not appear in logs (no-op)');
  console.log(
    '   Status: ',
    zapierConsole._isInitialized ? 'Initialized' : 'Not initialized',
  );

  console.log(
    '\n2. Running app with createAppTester (this initializes the middleware):',
  );
  const appTester = createAppTester(App);

  try {
    const results = await appTester(App.triggers.example.operation.perform, {});
    console.log('   Trigger results:', results);
    console.log(
      '   Status: ',
      zapierConsole._isInitialized ? 'Initialized' : 'Not initialized',
    );
  } catch (error) {
    console.error('   Error running app:', error.message);
  }

  console.log(
    '\n3. Testing standalone console AFTER middleware initialization:',
  );
  console.log('   (These should now work and appear in logs)');
  zapierConsole.log('This message should now appear in logs!');
  zapierConsole.error('This error should now appear in logs!');

  console.log('\n=== Demo Complete ===');
  console.log('\nKey takeaways:');
  console.log(
    '- You can now do: import { console } from "zapier-platform-core"',
  );
  console.log('- The console works as no-ops before middleware initialization');
  console.log('- After initialization, it works just like z.console');
  console.log('- Backward compatibility with z.console is maintained');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { App };
