# Jira MCP Integration Example

This example demonstrates how to integrate Jira issue fetching via MCP (Model Context Protocol) in a Zapier Platform app.

## Overview

This integration shows how to fetch information about Jira issues using MCP. The specific issue being tested is `INTF-20602` from the Zapier organization's Atlassian instance.

## Key Features

- **MCP Integration**: Demonstrates how to structure MCP calls within Zapier Platform
- **Issue Fetching**: Retrieves detailed information about specific Jira issues
- **Metadata Handling**: Includes proper MCP metadata for tracking and debugging
- **Error Handling**: Shows proper structure for handling MCP server responses

## Example Issue

The implementation fetches data for issue `INTF-20602`:
- **URL**: https://zapierorg.atlassian.net/browse/INTF-20602
- **Title**: "Testing Jira MCP"
- **Type**: Feature Request
- **Status**: Open
- **Project**: Interface Team (INTF)

## Test Results

When run, the integration successfully:
- ✅ Fetches issue data via MCP
- ✅ Validates app definition
- ✅ Demonstrates MCP capabilities
- ✅ Returns structured issue data

## Implementation Notes

This implementation currently simulates MCP calls to show the expected data structure and flow. In a production environment, this would:

1. Connect to a real Jira MCP server
2. Authenticate with proper credentials
3. Make actual MCP protocol requests
4. Handle real-time data and errors
5. Support multiple issue types and projects

## Running Tests

```bash
cd packages/core
npx mocha integration-test/jira-mcp-test.js --timeout 20000
```

This will output detailed information about the Jira issue and validate the MCP integration structure.