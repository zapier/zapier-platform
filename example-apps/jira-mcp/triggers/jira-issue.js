/**
 * Jira Issue Trigger with MCP Integration
 *
 * This trigger demonstrates how to fetch Jira issue information
 * using MCP (Model Context Protocol) integration.
 */

const performJiraIssue = async (z, bundle) => {
  const issueKey = bundle.inputData.issueKey || 'INTF-20602';

  z.console.log(`Fetching Jira issue: ${issueKey} via MCP`);

  // In a real MCP implementation, this would:
  // 1. Connect to the Jira MCP server
  // 2. Call the get_issue function with the issue key
  // 3. Return structured data from the MCP server

  // For demonstration, we simulate the MCP server response
  const mcpResponse = await simulateJiraMCPCall(z, issueKey);

  return [mcpResponse];
};

/**
 * Simulates an MCP call to fetch Jira issue data
 * In production, this would be replaced with actual MCP client code
 */
const simulateJiraMCPCall = async (z, issueKey) => {
  z.console.log(`Making MCP call to jira-mcp-server for issue: ${issueKey}`);

  // Simulate MCP protocol communication
  const mcpRequest = {
    protocol: 'mcp/1.0',
    method: 'call_tool',
    params: {
      name: 'get_jira_issue',
      arguments: {
        issueKey: issueKey,
        fields: [
          'summary',
          'description',
          'status',
          'priority',
          'assignee',
          'reporter',
          'created',
          'updated',
          'project',
          'issuetype',
        ],
      },
    },
  };

  z.console.log(`MCP Request: ${JSON.stringify(mcpRequest, null, 2)}`);

  // Simulate the response that would come from a Jira MCP server
  const mcpResponse = {
    id: issueKey,
    key: issueKey,
    self: `https://zapierorg.atlassian.net/rest/api/2/issue/${issueKey}`,
    url: `https://zapierorg.atlassian.net/browse/${issueKey}`,

    fields: {
      summary: 'Testing Jira MCP',
      description:
        'Get info on Jira issue https://zapierorg.atlassian.net/browse/INTF-20602 via MCP',

      status: {
        self: 'https://zapierorg.atlassian.net/rest/api/2/status/1',
        description: '',
        iconUrl:
          'https://zapierorg.atlassian.net/images/icons/statuses/open.png',
        name: 'Open',
        id: '1',
        statusCategory: {
          self: 'https://zapierorg.atlassian.net/rest/api/2/statuscategory/2',
          id: 2,
          key: 'new',
          colorName: 'blue-gray',
          name: 'To Do',
        },
      },

      priority: {
        self: 'https://zapierorg.atlassian.net/rest/api/2/priority/3',
        iconUrl:
          'https://zapierorg.atlassian.net/images/icons/priorities/medium.svg',
        name: 'Medium',
        id: '3',
      },

      project: {
        self: 'https://zapierorg.atlassian.net/rest/api/2/project/10001',
        id: '10001',
        key: 'INTF',
        name: 'Interface Team',
        projectTypeKey: 'software',
        simplified: false,
        avatarUrls: {
          '48x48':
            'https://zapierorg.atlassian.net/secure/projectavatar?pid=10001&avatarId=10324',
          '24x24':
            'https://zapierorg.atlassian.net/secure/projectavatar?size=small&pid=10001&avatarId=10324',
          '16x16':
            'https://zapierorg.atlassian.net/secure/projectavatar?size=xsmall&pid=10001&avatarId=10324',
          '32x32':
            'https://zapierorg.atlassian.net/secure/projectavatar?size=medium&pid=10001&avatarId=10324',
        },
      },

      issuetype: {
        self: 'https://zapierorg.atlassian.net/rest/api/2/issuetype/4',
        id: '4',
        description: 'A request for a new feature.',
        iconUrl:
          'https://zapierorg.atlassian.net/secure/viewavatar?size=xsmall&avatarId=10311&avatarType=issuetype',
        name: 'Feature Request',
        subtask: false,
        avatarId: 10311,
      },

      assignee: null,
      reporter: {
        self: 'https://zapierorg.atlassian.net/rest/api/2/user?username=copilot',
        name: 'copilot',
        key: 'copilot',
        emailAddress: 'copilot@zapier.com',
        avatarUrls: {
          '48x48': 'https://www.gravatar.com/avatar/48x48.png',
          '24x24': 'https://www.gravatar.com/avatar/24x24.png',
          '16x16': 'https://www.gravatar.com/avatar/16x16.png',
          '32x32': 'https://www.gravatar.com/avatar/32x32.png',
        },
        displayName: 'GitHub Copilot',
        active: true,
        timeZone: 'America/Los_Angeles',
      },

      created: '2024-01-15T10:30:00.000-0800',
      updated: new Date().toISOString(),
      labels: ['mcp', 'integration', 'feature-request'],
    },

    // MCP-specific metadata
    mcpMetadata: {
      server: 'jira-mcp-server',
      protocol: 'mcp/1.0',
      method: 'get_jira_issue',
      fetchedAt: new Date().toISOString(),
      source: 'zapierorg.atlassian.net',
      requestId: `mcp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    },
  };

  z.console.log(`MCP Response received for issue: ${issueKey}`);
  z.console.log(`Issue Summary: ${mcpResponse.fields.summary}`);
  z.console.log(`Issue Status: ${mcpResponse.fields.status.name}`);

  return mcpResponse;
};

module.exports = {
  key: 'jira_issue_mcp',
  noun: 'Jira Issue',

  display: {
    label: 'Jira Issue (via MCP)',
    description: 'Fetches Jira issue information using MCP integration',
  },

  operation: {
    inputFields: [
      {
        key: 'issueKey',
        label: 'Issue Key',
        type: 'string',
        required: false,
        helpText:
          'The Jira issue key (e.g., INTF-20602). Defaults to INTF-20602 for testing.',
        default: 'INTF-20602',
      },
    ],

    perform: performJiraIssue,

    sample: {
      id: 'INTF-20602',
      key: 'INTF-20602',
      url: 'https://zapierorg.atlassian.net/browse/INTF-20602',
      fields: {
        summary: 'Testing Jira MCP',
        status: {
          name: 'Open',
        },
        project: {
          key: 'INTF',
          name: 'Interface Team',
        },
      },
    },
  },
};
