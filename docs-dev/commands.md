# Command Quick Reference

## Root-Level Commands (run from repository root)

### Installation & Setup
```bash
pnpm install           # Install all dependencies
```

### Testing
```bash
pnpm test              # Run all tests (all packages + schema-to-ts)
pnpm smoke-test        # Run smoke tests (cli, core, schema only)
pnpm validate          # Full validation (test + smoke-test + lint)
```

### Code Quality
```bash
pnpm lint              # Lint all packages
pnpm lint:fix          # Fix linting issues
```

### Build & Release
```bash
pnpm generate-types    # Generate TypeScript declarations
pnpm bump     # Bump versions across packages
```

## Package-Specific Commands (cd into package first)

### CLI (`packages/cli/`)
```bash
pnpm test              # Unit tests
pnpm smoke-test        # Smoke tests  
pnpm validate          # test + smoke-test + lint
```

### Core (`packages/core/`)
```bash
pnpm main-tests        # Unit tests only
pnpm type-tests        # TypeScript definition tests
pnpm test              # main-tests + solo test + type-tests
pnpm integration-test  # Integration tests
pnpm smoke-test        # Smoke tests
pnpm validate          # Full validation
```

### Schema (`packages/schema/`)
```bash
pnpm test              # Unit tests
pnpm smoke-test        # Smoke tests
pnpm validate          # test + smoke-test + lint
```

### Schema-to-ts (`schema-to-ts/`)
```bash
pnpm test              # Uses vitest (not mocha)
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
cd packages/core && pnpm link
cd packages/schema && pnpm link
```

### Use in Integration Project
```bash
# In your integration project directory
pnpm link zapier-platform-core
pnpm link zapier-platform-schema
```

### Verify Linking
```bash
# Check that packages are symlinked
ls -hl node_modules/zapier-platform-*
# Should show: node_modules/zapier-platform-core -> .../pnpm/global/5/node_modules/zapier-platform-core
```

### Unlink
```bash
# Return to npm packages
pnpm unlink zapier-platform-core
pnpm unlink zapier-platform-schema
```
