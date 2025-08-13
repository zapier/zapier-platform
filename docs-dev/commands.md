# Command Quick Reference

## Root-Level Commands (run from repository root)

### Installation & Setup
```bash
yarn                    # Install all dependencies
```

### Testing
```bash
yarn test              # Run all tests (all packages + schema-to-ts)
yarn smoke-test        # Run smoke tests (cli, core, schema only)
yarn validate          # Full validation (test + smoke-test + lint)
```

### Code Quality
```bash
yarn lint              # Lint all packages
yarn lint:fix          # Fix linting issues
```

### Build & Release
```bash
yarn generate-types    # Generate TypeScript declarations
./scripts/bump.js      # Bump versions across packages
```

## Package-Specific Commands (cd into package first)

### CLI (`packages/cli/`)
```bash
yarn test              # Unit tests
yarn smoke-test        # Smoke tests  
yarn validate          # test + smoke-test + lint
```

### Core (`packages/core/`)
```bash
yarn main-tests        # Unit tests only
yarn type-tests        # TypeScript definition tests
yarn test              # main-tests + solo test + type-tests
yarn integration-test  # Integration tests
yarn smoke-test        # Smoke tests
yarn validate          # Full validation
```

### Schema (`packages/schema/`)
```bash
yarn test              # Unit tests
yarn smoke-test        # Smoke tests
yarn validate          # test + smoke-test + lint
```

### Schema-to-ts (`schema-to-ts/`)
```bash
yarn test              # Uses vitest (not mocha)
```

## Development Workflow Tips

- **Individual package testing**: Always `cd` into package directory first
- **Full validation**: Use `yarn validate` at root for comprehensive checking
- **Focused testing**: Use `.only` in Mocha for specific test cases
- **TypeScript types**: Generated automatically via husky precommit hooks

## Package Linking for Integration Development

When developing integrations, you may want to link to your local development versions of core and schema instead of the published npm packages.

### Setup Links
```bash
# Register the packages for linking
cd packages/core && yarn link
cd packages/schema && yarn link
```

### Use in Integration Project
```bash
# In your integration project directory
yarn link zapier-platform-core
yarn link zapier-platform-schema
```

### Verify Linking
```bash
# Check that packages are symlinked
ls -hl node_modules/zapier-platform-*
# Should show: node_modules/zapier-platform-core -> .../.config/yarn/link/zapier-platform-core
```

### Unlink
```bash
# Return to npm packages
yarn unlink zapier-platform-core
yarn unlink zapier-platform-schema
```