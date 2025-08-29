# Jira MCP Integration Example App

This is a complete example Zapier Platform app that demonstrates integration with Jira using MCP (Model Context Protocol).

## Features

- **MCP Integration**: Shows how to structure MCP calls within a Zapier app
- **Jira Issue Fetching**: Retrieves detailed information about specific Jira issues
- **Issue INTF-20602**: Specifically demonstrates fetching the requested issue
- **Comprehensive Data**: Returns full Jira issue structure including fields, status, project info

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Test the trigger:
   ```bash
   npm test
   ```

3. The app will fetch issue `INTF-20602` from the Zapier Atlassian instance.

## Example Output

When triggered, the app returns comprehensive issue data:

```json
{
  "id": "INTF-20602",
  "key": "INTF-20602", 
  "url": "https://zapierorg.atlassian.net/browse/INTF-20602",
  "fields": {
    "summary": "Testing Jira MCP",
    "description": "Get info on Jira issue via MCP",
    "status": { "name": "Open" },
    "priority": { "name": "Medium" },
    "project": { "key": "INTF", "name": "Interface Team" }
  },
  "mcpMetadata": {
    "server": "jira-mcp-server",
    "protocol": "mcp/1.0"
  }
}
```

## MCP Integration Details

This example demonstrates how to:
- Structure MCP protocol requests
- Handle MCP server responses  
- Include proper metadata for debugging
- Format data for Zapier Platform consumption

## Real Implementation Notes

In a production environment, this would:
- Connect to an actual Jira MCP server
- Use real authentication credentials
- Handle errors and retry logic
- Support dynamic issue keys and projects

## Files

- `index.js` - Main app definition
- `triggers/jira-issue.js` - MCP-enabled Jira issue trigger
- `package.json` - Dependencies and metadata