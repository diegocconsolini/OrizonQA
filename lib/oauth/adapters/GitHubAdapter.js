/**
 * GitHub OAuth Adapter
 *
 * Implements OAuthProvider interface for GitHub.
 *
 * Features:
 * - OAuth 2.0 authorization code flow
 * - Repository access (public + private with 'repo' scope)
 * - User profile fetching
 * - Repository listing and content access
 * - Token refresh (GitHub tokens don't expire by default)
 *
 * Scopes:
 * - read:user - Read user profile
 * - user:email - Access email addresses
 * - repo - Full repository access (public + private)
 *
 * Documentation: https://docs.github.com/en/developers/apps/building-oauth-apps
 */

import OAuthProvider from '../OAuthProvider.js';

export default class GitHubAdapter extends OAuthProvider {
  constructor(config = {}) {
    super('github', config);

    this.clientId = config.clientId || process.env.GITHUB_CLIENT_ID;
    this.clientSecret = config.clientSecret || process.env.GITHUB_CLIENT_SECRET;
    this.authUrl = 'https://github.com/login/oauth/authorize';
    this.tokenUrl = 'https://github.com/login/oauth/access_token';
    this.apiUrl = 'https://api.github.com';

    if (!this.clientId || !this.clientSecret) {
      throw new Error('GitHub OAuth credentials not configured');
    }
  }

  /**
   * Get GitHub authorization URL
   */
  async getAuthorizationUrl({ state, scopes, redirectUri }) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      state: state,
      allow_signup: 'true',
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken({ code, redirectUri }) {
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
    }

    return {
      access_token: data.access_token,
      token_type: data.token_type,
      scope: data.scope ? data.scope.split(',') : [],
    };
  }

  /**
   * Refresh access token
   * Note: GitHub tokens don't expire by default, so this is a no-op
   */
  async refreshAccessToken(refreshToken) {
    throw new Error('GitHub tokens do not expire and cannot be refreshed');
  }

  /**
   * Revoke access token
   */
  async revokeAccessToken(accessToken) {
    try {
      const response = await fetch(
        `https://api.github.com/applications/${this.clientId}/token`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
            'Accept': 'application/vnd.github+json',
          },
          body: JSON.stringify({
            access_token: accessToken,
          }),
        }
      );

      return response.status === 204;
    } catch (error) {
      console.error('GitHub token revocation failed:', error);
      return false;
    }
  }

  /**
   * Get authenticated user's profile
   */
  async getUserProfile(accessToken) {
    const [userResponse, emailsResponse] = await Promise.all([
      fetch(`${this.apiUrl}/user`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github+json',
        },
      }),
      fetch(`${this.apiUrl}/user/emails`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github+json',
        },
      }),
    ]);

    const user = await userResponse.json();
    const emails = await emailsResponse.json();

    const primaryEmail = emails.find(e => e.primary)?.email || user.email;

    return {
      id: String(user.id),
      username: user.login,
      email: primaryEmail,
      name: user.name,
      avatar_url: user.avatar_url,
      bio: user.bio,
      location: user.location,
      public_repos: user.public_repos,
      followers: user.followers,
      following: user.following,
    };
  }

  /**
   * List user's repositories
   */
  async listRepositories(accessToken, options = {}) {
    const {
      page = 1,
      perPage = 30,
      sort = 'updated',
      visibility = 'all', // 'all', 'public', 'private'
    } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      sort: sort,
      visibility: visibility,
    });

    const response = await fetch(
      `${this.apiUrl}/user/repos?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const repos = await response.json();

    return repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      owner: repo.owner.login,
      private: repo.private,
      description: repo.description,
      url: repo.html_url,
      clone_url: repo.clone_url,
      ssh_url: repo.ssh_url,
      default_branch: repo.default_branch,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      updated_at: repo.updated_at,
      created_at: repo.created_at,
    }));
  }

  /**
   * Get repository contents (file tree)
   */
  async getRepositoryContents(accessToken, { owner, repo, path = '', ref = 'main' }) {
    const url = `${this.apiUrl}/repos/${owner}/${repo}/contents/${path}?ref=${ref}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const contents = await response.json();

    // Normalize single file vs directory response
    const items = Array.isArray(contents) ? contents : [contents];

    return items.map(item => ({
      name: item.name,
      path: item.path,
      type: item.type, // 'file', 'dir', 'symlink'
      size: item.size,
      sha: item.sha,
      url: item.html_url,
      download_url: item.download_url,
    }));
  }

  /**
   * Get raw file content from repository
   */
  async getFileContent(accessToken, { owner, repo, path, ref = 'main' }) {
    const url = `${this.apiUrl}/repos/${owner}/${repo}/contents/${path}?ref=${ref}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.raw',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return await response.text();
  }

  /**
   * Get provider metadata
   */
  getMetadata() {
    return {
      name: 'github',
      displayName: 'GitHub',
      icon: '/github-icon.svg',
      supportedScopes: [
        { value: 'read:user', label: 'Read user profile', required: true },
        { value: 'user:email', label: 'Access email addresses', required: true },
        { value: 'repo', label: 'Full repository access', required: false },
        { value: 'public_repo', label: 'Public repository access', required: false },
      ],
      supportsRefreshToken: false,
      supportsRevocation: true,
      defaultScopes: ['read:user', 'user:email'],
      repoAccessScopes: ['repo'], // Scopes needed for private repo access
    };
  }
}
