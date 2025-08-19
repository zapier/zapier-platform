# Cursor Rules for Zapier Platform

You are working on the Zapier Platform monorepo containing packages for the Zapier Developer Platform Experience.

## Repository Documentation

For detailed repository information, reference these documentation files:

### Primary Documentation
- README.md - Repository overview, package descriptions, all doc links
- CONTRIBUTING.md - Setup, testing workflow, yarn linking  
- ARCHITECTURE.md - Repository structure and organization

### Quick Reference (docs-dev/)
- docs-dev/package-info.md - Package purposes and relationships
- docs-dev/commands.md - Command cheat sheet and workflows
- docs-dev/install-dev.md - Development CLI setup

## Development Guidelines

When working with this codebase:

1. **Documentation updates**: Always update existing markdown files (README.md, CONTRIBUTING.md, etc.) or `docs-dev/` files instead of this .cursor/rules file for repository information changes.

2. **Package relationships**: Reference `docs-dev/package-info.md` to understand package interdependencies before making changes across packages.

3. **Testing workflow**: 
   - Use `yarn validate` at root for comprehensive validation
   - Individual package testing requires `cd` into the specific package directory first
   - Follow existing Mocha patterns with `.only` for focused testing

4. **Monorepo patterns**:
   - Root-level commands use yarn workspaces
   - Package-specific commands require navigating to package directory
   - TypeScript types are auto-generated via husky hooks - no manual intervention needed

5. **Code style**:
   - Follow existing code conventions within each package
   - Use existing utility functions and established patterns
   - Maintain consistency with the package's existing architecture

## Key Commands

For complete command reference, see docs-dev/commands.md.

Essential commands:
- `yarn test` - Run all tests across all packages
- `yarn validate` - Full validation (test + smoke-test + lint)
- `yarn generate-types` - Generate TypeScript declarations
- Individual packages: `cd packages/[package-name]` then `yarn test`

## Package Structure

- zapier-platform-cli (packages/cli/) - Developer-facing CLI tool
- zapier-platform-core (packages/core/) - Runtime functionality for Zapier apps
- zapier-platform-schema (packages/schema/) - App structure validation source of truth
- zapier-platform-legacy-scripting-runner (packages/legacy-scripting-runner/) - Legacy compatibility layer
- schema-to-ts (schema-to-ts/) - TypeScript declaration generator