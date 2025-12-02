/**
 * GitHub Integration Module
 *
 * Phase 2.5.3: GitHub Integration
 * - OAuth 2.0 authentication flow
 * - Issues API client
 * - Pull Requests API client
 * - Webhook event handling
 */

import crypto from 'crypto';

const GITHUB_API_BASE = 'https://api.github.com';

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
 * GitHub API Client
 */
export class GitHubClient {
  constructor(config) {
    this.owner = config.owner;
    this.repo = config.repo;
    this.token = config.token;
  }

  /**
   * Build API URL
   */
  buildUrl(path) {
    return `${GITHUB_API_BASE}${path}`;
  }

  /**
   * Make authenticated API request
   */
  async request(path, options = {}) {
    const url = this.buildUrl(path);
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ORIZON-QA',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Test connection to GitHub
   */
  async testConnection() {
    try {
      const data = await this.request(`/repos/${this.owner}/${this.repo}`);
      return {
        success: true,
        message: 'Connection successful',
        repo: data.full_name,
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
    const data = await this.request(`/repos/${this.owner}/${this.repo}/issues?state=${state}&per_page=100`);
    return data.filter(issue => !issue.pull_request); // Filter out PRs
  }

  /**
   * Get issue by number
   */
  async getIssue(number) {
    const data = await this.request(`/repos/${this.owner}/${this.repo}/issues/${number}`);
    return data;
  }

  /**
   * Create issue
   */
  async createIssue(title, body, labels = []) {
    const data = await this.request(`/repos/${this.owner}/${this.repo}/issues`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        body,
        labels,
      }),
    });

    return data;
  }

  /**
   * Update issue
   */
  async updateIssue(number, updates) {
    const data = await this.request(`/repos/${this.owner}/${this.repo}/issues/${number}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    return data;
  }

  /**
   * Add comment to issue
   */
  async addIssueComment(number, body) {
    const data = await this.request(`/repos/${this.owner}/${this.repo}/issues/${number}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });

    return data;
  }

  /**
   * Map GitHub issue to ORIZON requirement
   */
  mapIssueToRequirement(issue) {
    return {
      external_id: `GH-${issue.number}`,
      external_url: issue.html_url,
      key: `GH-${issue.number}`,
      title: issue.title,
      description: issue.body || '',
      type: this.mapIssueType(issue.labels),
      status: this.mapIssueState(issue.state),
      priority: this.mapIssuePriority(issue.labels),
      version: issue.milestone?.title || '1.0',
    };
  }

  /**
   * Map GitHub issue labels to ORIZON type
   */
  mapIssueType(labels) {
    const labelNames = labels.map(l => l.name.toLowerCase());

    if (labelNames.includes('bug')) return 'Bug';
    if (labelNames.includes('enhancement') || labelNames.includes('feature')) return 'Story';
    if (labelNames.includes('epic')) return 'Epic';

    return 'Task';
  }

  /**
   * Map GitHub issue state to ORIZON status
   */
  mapIssueState(state) {
    const stateMap = {
      'open': 'Open',
      'closed': 'Closed',
    };
    return stateMap[state] || 'Open';
  }

  /**
   * Map GitHub issue labels to ORIZON priority
   */
  mapIssuePriority(labels) {
    const labelNames = labels.map(l => l.name.toLowerCase());

    if (labelNames.includes('critical') || labelNames.includes('p0')) return 'Critical';
    if (labelNames.includes('high') || labelNames.includes('p1')) return 'High';
    if (labelNames.includes('low') || labelNames.includes('p3')) return 'Low';

    return 'Medium';
  }

  /**
   * Get pull requests
   */
  async getPullRequests(state = 'all') {
    const data = await this.request(`/repos/${this.owner}/${this.repo}/pulls?state=${state}&per_page=100`);
    return data;
  }

  /**
   * Get pull request by number
   */
  async getPullRequest(number) {
    const data = await this.request(`/repos/${this.owner}/${this.repo}/pulls/${number}`);
    return data;
  }

  /**
   * Add comment to pull request
   */
  async addPRComment(number, body) {
    const data = await this.request(`/repos/${this.owner}/${this.repo}/issues/${number}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });

    return data;
  }

  /**
   * Get workflow runs
   */
  async getWorkflowRuns() {
    const data = await this.request(`/repos/${this.owner}/${this.repo}/actions/runs?per_page=100`);
    return data.workflow_runs;
  }

  /**
   * Get workflow run by ID
   */
  async getWorkflowRun(runId) {
    const data = await this.request(`/repos/${this.owner}/${this.repo}/actions/runs/${runId}`);
    return data;
  }
}

/**
 * Validate GitHub webhook signature
 */
export function validateWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const calculatedSignature = 'sha256=' + hmac.digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  );
}

/**
 * Parse GitHub webhook event
 */
export function parseWebhookEvent(payload) {
  const event = payload;

  // Issues events
  if (event.issue) {
    return {
      type: 'issue',
      action: event.action,
      issue: event.issue,
      repository: event.repository,
    };
  }

  // Pull request events
  if (event.pull_request) {
    return {
      type: 'pull_request',
      action: event.action,
      pullRequest: event.pull_request,
      repository: event.repository,
    };
  }

  // Push events
  if (event.ref && event.commits) {
    return {
      type: 'push',
      ref: event.ref,
      commits: event.commits,
      repository: event.repository,
    };
  }

  // Workflow run events
  if (event.workflow_run) {
    return {
      type: 'workflow_run',
      action: event.action,
      workflowRun: event.workflow_run,
      repository: event.repository,
    };
  }

  return {
    type: 'unknown',
    payload: event,
  };
}

/**
 * Initialize GitHub integration for a project
 */
export async function initializeGitHub(projectId, config, encryptionKey) {
  const { owner, repo, token } = config;

  // Encrypt token
  const encryptedToken = encrypt(token, encryptionKey);

  // Store integration config
  const integrationConfig = {
    owner,
    repo,
    token_encrypted: encryptedToken,
  };

  // Test connection
  const client = new GitHubClient({
    owner,
    repo,
    token,
  });

  const testResult = await client.testConnection();

  if (!testResult.success) {
    throw new Error(`Failed to connect to GitHub: ${testResult.message}`);
  }

  return {
    integration_type: 'github',
    integration_config: integrationConfig,
    sync_status: 'idle',
  };
}

/**
 * Get GitHub client from project integration config
 */
export function getGitHubClient(project, encryptionKey) {
  if (project.integration_type !== 'github') {
    throw new Error('Project is not configured for GitHub integration');
  }

  const config = project.integration_config;
  const token = decrypt(config.token_encrypted, encryptionKey);

  return new GitHubClient({
    owner: config.owner,
    repo: config.repo,
    token,
  });
}

/**
 * Format test results as GitHub PR comment
 */
export function formatTestResultsComment(testRun, results) {
  const passed = results.filter(r => r.status === 'Passed').length;
  const failed = results.filter(r => r.status === 'Failed').length;
  const blocked = results.filter(r => r.status === 'Blocked').length;
  const total = results.length;

  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  let comment = `## Test Results: ${testRun.name}\n\n`;
  comment += `**Status**: ${testRun.status}\n`;
  comment += `**Pass Rate**: ${passRate}%\n\n`;
  comment += `| Status | Count |\n`;
  comment += `|--------|-------|\n`;
  comment += `| Passed | ${passed} |\n`;
  comment += `| Failed | ${failed} |\n`;
  comment += `| Blocked | ${blocked} |\n`;
  comment += `| **Total** | **${total}** |\n\n`;

  if (failed > 0) {
    comment += `### Failed Tests\n\n`;
    results.filter(r => r.status === 'Failed').forEach(result => {
      comment += `- **${result.test_case_title}**\n`;
      if (result.notes) {
        comment += `  ${result.notes}\n`;
      }
    });
  }

  comment += `\n---\n*Powered by ORIZON QA*`;

  return comment;
}
