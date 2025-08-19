# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation Reference

### Primary Documentation (read these first)
- **[README.md](README.md)** - Repository overview, package descriptions, all doc links
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Setup, testing workflow, yarn linking
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Repository structure and organization

### Quick Reference (for task-oriented work)
- **[docs-dev/install-dev.md](docs-dev/install-dev.md)** - Development CLI setup
- **[docs-dev/commands.md](docs-dev/commands.md)** - Command cheat sheet
- **[docs-dev/package-info.md](docs-dev/package-info.md)** - Package purposes and relationships

## Claude-Specific Workflow Notes

1. **Documentation updates**: Update existing markdown files (README.md, CONTRIBUTING.md, etc.) or `docs-dev/` files, not this CLAUDE.md
2. **Testing workflow**: Use `yarn validate` at root for full validation, or `cd` into specific packages for targeted testing
3. **TypeScript types**: Generated automatically via husky hooks - no manual intervention needed
4. **Package development**: Always understand package relationships from `docs-dev/package-info.md` before making changes
5. **Monorepo commands**: Use yarn workspaces from root; individual packages need `cd` first