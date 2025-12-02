/**
 * Azure DevOps Integration Module
 *
 * Phase 2.5.2: Azure DevOps Integration
 * - OAuth 2.0 authentication flow
 * - Work Items API client
 * - Test Plans API client
 * - Webhook event handling
 */

import crypto from 'crypto';

const AZURE_DEVOPS_API_VERSION = '7.1-preview.3';
const AZURE_DEVOPS_BASE_URL = 'https://dev.azure.com';

/**
 * Encrypt sensitive data (PAT tokens, etc.)
 */
function encrypt(text, encryptionKey) {
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey, 'hex'), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 */
function decrypt(encryptedText, encryptionKey) {
  const algorithm = 'aes-256-gcm';
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKey, 'hex'), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Azure DevOps API Client
 */
export class AzureDevOpsClient {
  constructor(config) {
    this.organization = config.organization;
    this.project = config.project;
    this.patToken = config.patToken;
    this.encryptionKey = config.encryptionKey || process.env.ENCRYPTION_KEY;
  }

  /**
   * Build API URL
   */
  buildUrl(path) {
    return `${AZURE_DEVOPS_BASE_URL}/${this.organization}/${this.project}/_apis/${path}?api-version=${AZURE_DEVOPS_API_VERSION}`;
  }

  /**
   * Make authenticated API request
   */
  async request(path, options = {}) {
    const url = this.buildUrl(path);
    const headers = {
      'Authorization': `Basic ${Buffer.from(`:${this.patToken}`).toString('base64')}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure DevOps API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Test connection to Azure DevOps
   */
  async testConnection() {
    try {
      const data = await this.request('wit/workitemtypes');
      return {
        success: true,
        message: 'Connection successful',
        workItemTypes: data.value.map(wit => wit.name),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Fetch work items by query
   * @param {string} wiql - Work Item Query Language query
   */
  async queryWorkItems(wiql) {
    const data = await this.request('wit/wiql', {
      method: 'POST',
      body: JSON.stringify({ query: wiql }),
    });

    if (!data.workItems || data.workItems.length === 0) {
      return [];
    }

    // Fetch work item details
    const ids = data.workItems.map(wi => wi.id).join(',');
    const detailsUrl = `wit/workitems?ids=${ids}&$expand=all`;
    const details = await this.request(detailsUrl);

    return details.value;
  }

  /**
   * Get all work items for the project
   */
  async getAllWorkItems(types = ['User Story', 'Bug', 'Task', 'Feature', 'Epic']) {
    const typeFilter = types.map(t => `[System.WorkItemType] = '${t}'`).join(' OR ');
    const wiql = `
      SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType]
      FROM WorkItems
      WHERE [System.TeamProject] = '${this.project}'
      AND (${typeFilter})
      ORDER BY [System.ChangedDate] DESC
    `;

    return this.queryWorkItems(wiql);
  }

  /**
   * Get work item by ID
   */
  async getWorkItem(id) {
    const data = await this.request(`wit/workitems/${id}?$expand=all`);
    return data;
  }

  /**
   * Create work item
   */
  async createWorkItem(type, fields) {
    const document = Object.entries(fields).map(([key, value]) => ({
      op: 'add',
      path: `/fields/${key}`,
      value,
    }));

    const data = await this.request(`wit/workitems/$${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json-patch+json',
      },
      body: JSON.stringify(document),
    });

    return data;
  }

  /**
   * Update work item
   */
  async updateWorkItem(id, fields) {
    const document = Object.entries(fields).map(([key, value]) => ({
      op: 'add',
      path: `/fields/${key}`,
      value,
    }));

    const data = await this.request(`wit/workitems/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json-patch+json',
      },
      body: JSON.stringify(document),
    });

    return data;
  }

  /**
   * Map Azure DevOps work item to ORIZON requirement
   */
  mapWorkItemToRequirement(workItem) {
    const fields = workItem.fields;

    return {
      external_id: `ADO-${workItem.id}`,
      external_url: workItem.url.replace('_apis/wit/workItems', '_workitems/edit'),
      key: `ADO-${workItem.id}`,
      title: fields['System.Title'],
      description: fields['System.Description'] || '',
      type: this.mapWorkItemType(fields['System.WorkItemType']),
      status: this.mapWorkItemState(fields['System.State']),
      priority: this.mapWorkItemPriority(fields['Microsoft.VSTS.Common.Priority']),
      version: fields['System.IterationPath']?.split('\\').pop() || '1.0',
    };
  }

  /**
   * Map Azure DevOps work item type to ORIZON type
   */
  mapWorkItemType(adoType) {
    const typeMap = {
      'User Story': 'Story',
      'Bug': 'Bug',
      'Task': 'Task',
      'Feature': 'Epic',
      'Epic': 'Epic',
    };
    return typeMap[adoType] || 'Task';
  }

  /**
   * Map Azure DevOps state to ORIZON status
   */
  mapWorkItemState(adoState) {
    const stateMap = {
      'New': 'Open',
      'Active': 'In Progress',
      'Resolved': 'In Review',
      'Closed': 'Closed',
      'Removed': 'Closed',
    };
    return stateMap[adoState] || 'Open';
  }

  /**
   * Map Azure DevOps priority to ORIZON priority
   */
  mapWorkItemPriority(adoPriority) {
    if (!adoPriority) return 'Medium';

    const priorityMap = {
      1: 'Critical',
      2: 'High',
      3: 'Medium',
      4: 'Low',
    };
    return priorityMap[adoPriority] || 'Medium';
  }

  /**
   * Get test plans
   */
  async getTestPlans() {
    const data = await this.request('testplan/plans');
    return data.value;
  }

  /**
   * Get test suites for a plan
   */
  async getTestSuites(planId) {
    const data = await this.request(`testplan/plans/${planId}/suites`);
    return data.value;
  }

  /**
   * Get test cases from a suite
   */
  async getTestCases(planId, suiteId) {
    const data = await this.request(`testplan/plans/${planId}/suites/${suiteId}/testcases`);
    return data.value;
  }

  /**
   * Create test run
   */
  async createTestRun(name, planId, testCaseIds) {
    const data = await this.request('test/runs', {
      method: 'POST',
      body: JSON.stringify({
        name,
        plan: { id: planId },
        pointIds: testCaseIds,
        automated: false,
      }),
    });

    return data;
  }

  /**
   * Update test results
   */
  async updateTestResults(runId, results) {
    const data = await this.request(`test/runs/${runId}/results`, {
      method: 'PATCH',
      body: JSON.stringify(results),
    });

    return data;
  }

  /**
   * Complete test run
   */
  async completeTestRun(runId) {
    const data = await this.request(`test/runs/${runId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        state: 'Completed',
      }),
    });

    return data;
  }
}

/**
 * Validate Azure DevOps webhook signature
 */
export function validateWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const calculatedSignature = hmac.digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  );
}

/**
 * Parse Azure DevOps webhook event
 */
export function parseWebhookEvent(payload) {
  const eventType = payload.eventType;
  const resource = payload.resource;

  switch (eventType) {
    case 'workitem.created':
    case 'workitem.updated':
      return {
        type: 'work_item',
        action: eventType.includes('created') ? 'created' : 'updated',
        workItem: resource,
      };

    case 'build.complete':
      return {
        type: 'build',
        action: 'completed',
        build: resource,
      };

    case 'git.push':
      return {
        type: 'git_push',
        action: 'pushed',
        push: resource,
      };

    default:
      return {
        type: 'unknown',
        action: eventType,
        resource,
      };
  }
}

/**
 * Initialize Azure DevOps integration for a project
 */
export async function initializeAzureDevOps(projectId, config, encryptionKey) {
  const { organization, project, patToken } = config;

  // Encrypt PAT token
  const encryptedToken = encrypt(patToken, encryptionKey);

  // Store integration config
  const integrationConfig = {
    organization,
    project,
    pat_token_encrypted: encryptedToken,
  };

  // Test connection
  const client = new AzureDevOpsClient({
    organization,
    project,
    patToken,
    encryptionKey,
  });

  const testResult = await client.testConnection();

  if (!testResult.success) {
    throw new Error(`Failed to connect to Azure DevOps: ${testResult.message}`);
  }

  return {
    integration_type: 'azure_devops',
    integration_config: integrationConfig,
    sync_status: 'idle',
  };
}

/**
 * Get Azure DevOps client from project integration config
 */
export function getAzureDevOpsClient(project, encryptionKey) {
  if (project.integration_type !== 'azure_devops') {
    throw new Error('Project is not configured for Azure DevOps integration');
  }

  const config = project.integration_config;
  const patToken = decrypt(config.pat_token_encrypted, encryptionKey);

  return new AzureDevOpsClient({
    organization: config.organization,
    project: config.project,
    patToken,
    encryptionKey,
  });
}
