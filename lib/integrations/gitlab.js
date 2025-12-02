/**
 * GitLab Integration Module
 *
 * Phase 2.5.4: GitLab Integration
 * - OAuth 2.0 authentication flow
 * - Issues API client
 * - Merge Requests API client
 * - Webhook event handling
 */

import crypto from 'crypto';

const GITLAB_API_BASE = 'https://gitlab.com/api/v4';

/**
 * Encrypt sensitive data (OAuth tokens, etc.)
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
 * GitLab API Client
 */
export class GitLabClient {
  constructor(config) {
    this.projectId = config.projectId;
    this.token = config.token;
    this.baseUrl = config.baseUrl || GITLAB_API_BASE;
  }

  /**
   * Build API URL
   */
  buildUrl(path) {
    return `${this.baseUrl}${path}`;
  }

  /**
   * Make authenticated API request
   */
  async request(path, options = {}) {
    const url = this.buildUrl(path);
    const headers = {
      'PRIVATE-TOKEN': this.token,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitLab API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Test connection to GitLab
   */
  async testConnection() {
    try {
      const data = await this.request(`/projects/${this.projectId}`);
      return {
        success: true,
        message: 'Connection successful',
        project: data.name_with_namespace,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get all issues
   */
  async getIssues(state = 'all') {
    const data = await this.request(`/projects/${this.projectId}/issues?state=${state}&per_page=100`);
    return data;
  }

  /**
   * Get issue by ID
   */
  async getIssue(iid) {
    const data = await this.request(`/projects/${this.projectId}/issues/${iid}`);
    return data;
  }

  /**
   * Create issue
   */
  async createIssue(title, description, labels = []) {
    const data = await this.request(`/projects/${this.projectId}/issues`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        description,
        labels: labels.join(','),
      }),
    });

    return data;
  }

  /**
   * Update issue
   */
  async updateIssue(iid, updates) {
    const data = await this.request(`/projects/${this.projectId}/issues/${iid}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    return data;
  }

  /**
   * Map GitLab issue to ORIZON requirement
   */
  mapIssueToRequirement(issue) {
    return {
      external_id: `GL-${issue.iid}`,
      external_url: issue.web_url,
      key: `GL-${issue.iid}`,
      title: issue.title,
      description: issue.description || '',
      type: this.mapIssueType(issue.labels),
      status: this.mapIssueState(issue.state),
      priority: this.mapIssuePriority(issue.labels, issue.weight),
      version: issue.milestone?.title || '1.0',
    };
  }

  /**
   * Map GitLab issue labels to ORIZON type
   */
  mapIssueType(labels) {
    const labelNames = labels.map(l => l.toLowerCase());

    if (labelNames.includes('bug')) return 'Bug';
    if (labelNames.includes('feature') || labelNames.includes('enhancement')) return 'Story';
    if (labelNames.includes('epic')) return 'Epic';

    return 'Task';
  }

  /**
   * Map GitLab issue state to ORIZON status
   */
  mapIssueState(state) {
    const stateMap = {
      'opened': 'Open',
      'closed': 'Closed',
    };
    return stateMap[state] || 'Open';
  }

  /**
   * Map GitLab issue to ORIZON priority
   */
  mapIssuePriority(labels, weight) {
    const labelNames = labels.map(l => l.toLowerCase());

    if (labelNames.includes('critical') || labelNames.includes('p0')) return 'Critical';
    if (labelNames.includes('high') || labelNames.includes('p1') || weight >= 4) return 'High';
    if (labelNames.includes('low') || labelNames.includes('p3') || weight === 1) return 'Low';

    return 'Medium';
  }

  /**
   * Get merge requests
   */
  async getMergeRequests(state = 'all') {
    const data = await this.request(`/projects/${this.projectId}/merge_requests?state=${state}&per_page=100`);
    return data;
  }

  /**
   * Get pipelines
   */
  async getPipelines() {
    const data = await this.request(`/projects/${this.projectId}/pipelines?per_page=100`);
    return data;
  }
}

/**
 * Validate GitLab webhook token
 */
export function validateWebhookToken(token, secret) {
  return token === secret;
}

/**
 * Parse GitLab webhook event
 */
export function parseWebhookEvent(payload) {
  const objectKind = payload.object_kind;

  switch (objectKind) {
    case 'issue':
      return {
        type: 'issue',
        action: payload.object_attributes.action,
        issue: payload.object_attributes,
      };

    case 'merge_request':
      return {
        type: 'merge_request',
        action: payload.object_attributes.action,
        mergeRequest: payload.object_attributes,
      };

    case 'push':
      return {
        type: 'push',
        ref: payload.ref,
        commits: payload.commits,
      };

    case 'pipeline':
      return {
        type: 'pipeline',
        action: payload.object_attributes.status,
        pipeline: payload.object_attributes,
      };

    default:
      return {
        type: 'unknown',
        payload,
      };
  }
}

/**
 * Initialize GitLab integration for a project
 */
export async function initializeGitLab(projectId, config, encryptionKey) {
  const { gitlabProjectId, token } = config;

  // Encrypt token
  const encryptedToken = encrypt(token, encryptionKey);

  // Store integration config
  const integrationConfig = {
    gitlab_project_id: gitlabProjectId,
    token_encrypted: encryptedToken,
  };

  // Test connection
  const client = new GitLabClient({
    projectId: gitlabProjectId,
    token,
  });

  const testResult = await client.testConnection();

  if (!testResult.success) {
    throw new Error(`Failed to connect to GitLab: ${testResult.message}`);
  }

  return {
    integration_type: 'gitlab',
    integration_config: integrationConfig,
    sync_status: 'idle',
  };
}

/**
 * Get GitLab client from project integration config
 */
export function getGitLabClient(project, encryptionKey) {
  if (project.integration_type !== 'gitlab') {
    throw new Error('Project is not configured for GitLab integration');
  }

  const config = project.integration_config;
  const token = decrypt(config.token_encrypted, encryptionKey);

  return new GitLabClient({
    projectId: config.gitlab_project_id,
    token,
  });
}
