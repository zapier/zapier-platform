# Zapier Platform Monorepo

The Zapier Platform is a comprehensive monorepo containing the CLI, core SDK, schema definitions, and example applications for building Zapier integrations. This repository uses Yarn workspaces with Lerna for monorepo management.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Initial Setup & Dependencies
- **Install dependencies**: `yarn install --frozen-lockfile` 
  - Takes ~4 minutes. NEVER CANCEL. Set timeout to 10+ minutes.
  - Installs for all workspaces (packages/cli, packages/core, packages/schema, packages/legacy-scripting-runner, schema-to-ts)
- **Required Node.js**: Version 18.x or 20.x (CI supports both)
- **Package manager**: Yarn v1.19.1+ (uses classic yarn, not berry)

### Build & Validation Commands
- **Validate the project**: `yarn validate` in any package directory
  - For CLI: `yarn validate` (includes test + smoke-test + lint)
  - For Core: `yarn test && yarn type-tests` 
  - For Schema: `yarn test` (very fast, ~1 second)
  - For schema-to-ts: `yarn test` (fast, ~3 seconds)

### Linting & Code Quality  
- **Lint all packages**: `yarn lint` - Takes ~9 seconds. Reports warnings but should complete successfully.
- **Fix linting issues**: `yarn lint:fix`
- **Always run before committing**: `yarn lint` or individual package linting will catch style issues that cause CI failures.

### Testing Strategy
- **Full test suite**: `yarn test` from root
  - NEVER CANCEL: Can take 5-10 minutes, some tests require network connectivity
  - Many tests will fail in sandboxed environments due to network restrictions (getaddrinfo EAI_AGAIN errors)
  - This is EXPECTED and does not indicate broken code

- **Package-specific testing**:
  - Schema: `cd packages/schema && yarn test` (passes quickly, ~1 second)
  - Schema-to-ts: `cd schema-to-ts && yarn test` (passes quickly, ~3 seconds)  
  - Core: `cd packages/core && yarn test` (network dependent, will fail in sandboxed environments)
  - CLI: `cd packages/cli && yarn test` (network dependent, build timeouts possible)

### CLI Development & Usage
- **Development CLI**: Use `node packages/cli/src/bin/run` for local testing
- **Available commands**: The CLI supports ~20 commands including build, validate, push, test, scaffold
- **Offline validation**: `zapier validate --without-style` works without network connectivity
- **Build command**: `zapier build` - Takes 1-2 minutes, requires network connectivity for validation

### Key Packages Overview
1. **packages/cli**: The main CLI tool developers use (`zapier` command)
2. **packages/core**: Runtime SDK that all Zapier apps depend on  
3. **packages/schema**: JSON Schema definitions for app structure validation
4. **packages/legacy-scripting-runner**: Compatibility layer for Legacy Web Builder apps
5. **schema-to-ts**: TypeScript type generation tooling

## Manual Validation Scenarios

After making changes, **ALWAYS** validate functionality with these steps:

### 1. CLI Functionality Test
```bash
cd example-apps/minimal
node ../../packages/cli/src/bin/run validate --without-style
```
Should output: "No structural errors found during validation routine. This project is structurally sound!"

### 2. Schema Validation Test  
```bash
cd packages/schema
yarn test
```
Should complete in ~1 second with all 200+ tests passing.

### 3. Type Generation Test
```bash 
cd schema-to-ts
yarn test
yarn generate-types
```
Should complete quickly and generate updated TypeScript definitions.

### 4. Example App Validation
Test with different example apps based on your changes:
- **Basic functionality**: `example-apps/minimal`
- **TypeScript**: `example-apps/basic-auth-typescript` (requires `npm run build` first)
- **Authentication**: `example-apps/oauth2`
- **Complex features**: `example-apps/github`

All should validate successfully with: `zapier validate --without-style`

## Known Issues & Workarounds

### Network Connectivity Limitations
- **Many tests fail in sandboxed environments** due to external API dependencies
- **Build validation requires network access** to Zapier's servers
- **Workaround**: Use `--without-style` flag for offline validation
- **Do NOT consider network failures as broken tests** - this is expected behavior

### Build Timeouts
- **CLI build tests can timeout after 50 seconds** - this is a test issue, not a code issue
- **Smoke tests may timeout after 2 minutes** - also expected in some environments
- **Solution**: Focus on schema and basic validation tests for quick feedback

### TypeScript Examples
- **TypeScript examples require compilation** before validation
- **Build command**: `npm run build` in the example directory
- **Examples**: `basic-auth-typescript`, `oauth1-trello-typescript`, etc.
- **Validation after build**: Works normally with `zapier validate --without-style`
- **Minor ESLint warnings are acceptable** (object-shorthand, unused eslint-disable)
- **Zero errors should be the goal**, warnings are informational
- **Always run `yarn lint` before committing** to avoid CI failures

## Common Workflows

### Making Changes to CLI
1. Edit files in `packages/cli/src/`
2. Test with: `node packages/cli/src/bin/run --help`
3. Validate with example app: `cd example-apps/minimal && node ../../packages/cli/src/bin/run validate --without-style`
4. Run: `cd packages/cli && yarn lint`

### Making Changes to Core  
1. Edit files in `packages/core/src/`
2. Test types: `cd packages/core && yarn type-tests` 
3. Run quick validation: `cd packages/schema && yarn test`
4. Generate types: `cd schema-to-ts && yarn generate-types`

### Making Changes to Schema
1. Edit files in `packages/schema/lib/`
2. Test immediately: `cd packages/schema && yarn test`
3. Regenerate types: `cd schema-to-ts && yarn generate-types`
4. Validate example apps still work

## File Structure Quick Reference
```
├── packages/
│   ├── cli/                 # Main CLI tool
│   ├── core/               # Runtime SDK  
│   ├── schema/             # JSON Schema definitions
│   └── legacy-scripting-runner/  # Legacy app compatibility
├── schema-to-ts/           # TypeScript type generation
├── example-apps/           # 30+ example integrations
│   ├── minimal/           # Simplest example
│   ├── basic-auth-typescript/  # TypeScript example
│   └── github/            # Complex real-world example
├── boilerplate/           # New project templates
└── docs/                 # Documentation files
```

## Timeout Recommendations
- **yarn install**: 10+ minutes (measured: ~4 minutes)  
- **Full test suite**: 15+ minutes (network dependent, expect failures)
- **Individual package tests**: 5+ minutes (most much faster)
- **CLI build operations**: 5+ minutes (network dependent)
- **Linting**: 30+ seconds (measured: ~9 seconds)
- **Schema validation**: 30+ seconds (measured: ~1 second)
- **Type generation**: 30+ seconds (measured: ~4 seconds)
- **TypeScript compilation**: 60+ seconds (for example apps)
- **CLI validation**: 30+ seconds (measured: ~1-2 seconds)

## Performance Notes
- **Schema tests are extremely fast** (~1 second) - use for quick validation
- **TypeScript compilation is fast** (~3 seconds) - good for iterative development  
- **Network-dependent operations will fail** in sandboxed environments - this is expected
- **Focus on offline-capable commands** for reliable development workflow