# GitHub Copilot Instructions

This file provides guidance to GitHub Copilot when working with code in the Zapier Platform repository.

## Repository Context

This is a monorepo containing the Zapier Platform Experience packages. For detailed repository information, reference these documentation files:

### Primary Documentation
- **[README.md](../README.md)** - Repository overview, package descriptions, all doc links
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Setup, testing workflow, pnpm linking  
- **[ARCHITECTURE.md](../ARCHITECTURE.md)** - Repository structure and organization

### Quick Reference
- **[docs-dev/package-info.md](../docs-dev/package-info.md)** - Package purposes and relationships
- **[docs-dev/commands.md](../docs-dev/commands.md)** - Command cheat sheet and workflows
- **[docs-dev/install-dev.md](../docs-dev/install-dev.md)** - Development CLI setup

## Copilot-Specific Guidelines

When suggesting code or providing assistance:

1. **Documentation updates**: Always update existing markdown files (README.md, CONTRIBUTING.md, etc.) or `docs-dev/` files instead of this copilot-instructions.md file for repository information changes.

2. **Package context**: Reference `docs-dev/package-info.md` to understand package relationships before suggesting changes across packages.

3. **Testing approach**: 
   - Use `pnpm validate` at root for comprehensive validation
   - Individual package testing requires `cd` into the specific package directory first
   - Follow existing Mocha patterns with `.only` for focused testing

4. **Monorepo workflows**:
   - Root-level commands use pnpm workspaces
   - Package-specific commands require navigating to package directory
   - TypeScript types are auto-generated via husky hooks

5. **Code patterns**:
   - Follow existing code style and conventions within each package
   - Use existing utility functions and established patterns
   - Maintain consistency with the package's existing architecture

## Development Commands

For complete command reference, see [docs-dev/commands.md](../docs-dev/commands.md). 

Key commands:
- `pnpm test` - Run all tests
- `pnpm validate` - Full validation (test + smoke-test + lint)
- `pnpm generate-types` - Generate TypeScript declarations
