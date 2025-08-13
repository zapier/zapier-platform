# Package Information

## Core Packages

### zapier-platform-cli (`packages/cli/`)
**Purpose**: Developer-facing CLI tool  
**Key Commands**: `push`, `promote`, `test`, `validate`, `init`  
**Dependencies**: Uses core and schema packages  
**Testing**: Mocha with smoke tests  

### zapier-platform-core (`packages/core/`)  
**Purpose**: Runtime functionality for all Zapier apps  
**Key Features**: HTTP middlewares, request handling, app execution  
**Dependencies**: Depends on schema for validation  
**Testing**: Unit tests + type tests + integration tests  
**TypeScript**: Includes generated type definitions  

### zapier-platform-schema (`packages/schema/`)
**Purpose**: Source of truth for app structure validation  
**Key Output**: `exported-schema.json` used by other packages  
**Dependencies**: Standalone, depended on by others  
**Testing**: Functional constraints and schema validation  

### zapier-platform-legacy-scripting-runner (`packages/legacy-scripting-runner/`)
**Purpose**: Backward compatibility for Legacy Web Builder apps  
**Key Function**: Provides shim layer for legacy apps  
**Dependencies**: Minimal, focused compatibility layer  

## Supporting Tools

### schema-to-ts (`schema-to-ts/`)
**Purpose**: Generate TypeScript declarations for core package  
**Input**: `exported-schema.json` from schema package  
**Output**: Type definitions bundled into core package  
**Build Process**: Runs via `generate-types` script and husky hooks  
**Testing**: Uses vitest instead of mocha  

## Key Relationships

1. **Schema → Core**: Schema validates app structure, core provides runtime
2. **Core → CLI**: CLI orchestrates core functionality  
3. **Schema → schema-to-ts → Core**: Types flow from schema through generator to core
4. **All → Legacy Runner**: Provides compatibility bridge

## Monorepo Structure
- **Root**: Tooling, configuration, examples, documentation
- **packages/**: Main platform packages
- **example-apps/**: Sample integrations
- **boilerplate/**: Minimal app template for Visual Builder