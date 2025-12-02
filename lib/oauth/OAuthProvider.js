/**
 * OAuthProvider Base Class
 *
 * Abstract base class for OAuth provider adapters.
 * Defines the interface that all OAuth providers must implement.
 *
 * Supported Providers (planned):
 * - GitHub (GitHubAdapter)
 * - GitLab (GitLabAdapter)
 * - Bitbucket (BitbucketAdapter)
 *
 * Design Pattern: Adapter Pattern
 * - Each provider implements this interface
 * - IntegrationManager orchestrates provider instances
 * - Shared encryption/database logic extracted to utilities
 *
 * Usage:
 *   class GitHubAdapter extends OAuthProvider {
 *     // Implement abstract methods
 *   }
 */

export default class OAuthProvider {
  /**
   * @param {string} providerName - Provider identifier ('github', 'gitlab', etc.)
   * @param {object} config - Provider-specific configuration
   */
  constructor(providerName, config = {}) {
    if (this.constructor === OAuthProvider) {
      throw new Error('OAuthProvider is an abstract class and cannot be instantiated directly');
    }

    this.providerName = providerName;
    this.config = config;
  }

  /**
   * Get OAuth authorization URL
   *
   * @param {object} params - Authorization parameters
   * @param {string} params.state - CSRF protection state parameter
   * @param {string[]} params.scopes - Requested OAuth scopes
   * @param {string} params.redirectUri - Callback URL
   * @returns {Promise<string>} Authorization URL to redirect user to
   * @abstract
   */
  async getAuthorizationUrl(params) {
    throw new Error('getAuthorizationUrl() must be implemented by subclass');
  }

  /**
   * Exchange authorization code for access token
   *
   * @param {object} params - Token exchange parameters
   * @param {string} params.code - Authorization code from callback
   * @param {string} params.redirectUri - Callback URL (must match authorization)
   * @returns {Promise<object>} Token response
   * @returns {string} returns.access_token - Access token
   * @returns {string} [returns.refresh_token] - Refresh token (optional)
   * @returns {number} [returns.expires_in] - Token expiration in seconds
   * @returns {string[]} [returns.scopes] - Granted scopes
   * @abstract
   */
  async exchangeCodeForToken(params) {
    throw new Error('exchangeCodeForToken() must be implemented by subclass');
  }

  /**
   * Refresh an expired access token
   *
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<object>} New token response
   * @returns {string} returns.access_token - New access token
   * @returns {string} [returns.refresh_token] - New refresh token
   * @returns {number} [returns.expires_in] - Token expiration in seconds
   * @abstract
   */
  async refreshAccessToken(refreshToken) {
    throw new Error('refreshAccessToken() must be implemented by subclass');
  }

  /**
   * Revoke an access token (optional, not all providers support this)
   *
   * @param {string} accessToken - Access token to revoke
   * @returns {Promise<boolean>} True if revoked successfully
   */
  async revokeAccessToken(accessToken) {
    // Default: no-op (not all providers support revocation)
    console.warn(`${this.providerName}: Token revocation not implemented`);
    return true;
  }

  /**
   * Get authenticated user's profile information
   *
   * @param {string} accessToken - Access token
   * @returns {Promise<object>} User profile
   * @returns {string} returns.id - Provider user ID
   * @returns {string} returns.username - Username
   * @returns {string} [returns.email] - Email address
   * @returns {string} [returns.name] - Display name
   * @returns {string} [returns.avatar_url] - Avatar image URL
   * @abstract
   */
  async getUserProfile(accessToken) {
    throw new Error('getUserProfile() must be implemented by subclass');
  }

  /**
   * List user's repositories
   *
   * @param {string} accessToken - Access token
   * @param {object} [options] - Listing options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.perPage=30] - Results per page
   * @param {string} [options.sort='updated'] - Sort field
   * @param {string} [options.visibility='all'] - 'all', 'public', 'private'
   * @returns {Promise<Array>} Array of repositories
   * @abstract
   */
  async listRepositories(accessToken, options = {}) {
    throw new Error('listRepositories() must be implemented by subclass');
  }

  /**
   * Get repository contents (file tree)
   *
   * @param {string} accessToken - Access token
   * @param {object} params - Repository parameters
   * @param {string} params.owner - Repository owner
   * @param {string} params.repo - Repository name
   * @param {string} [params.path=''] - Path within repository
   * @param {string} [params.ref='main'] - Branch/tag/commit reference
   * @returns {Promise<Array>} Array of files/directories
   * @abstract
   */
  async getRepositoryContents(accessToken, params) {
    throw new Error('getRepositoryContents() must be implemented by subclass');
  }

  /**
   * Get raw file content from repository
   *
   * @param {string} accessToken - Access token
   * @param {object} params - File parameters
   * @param {string} params.owner - Repository owner
   * @param {string} params.repo - Repository name
   * @param {string} params.path - File path
   * @param {string} [params.ref='main'] - Branch/tag/commit reference
   * @returns {Promise<string>} File content
   * @abstract
   */
  async getFileContent(accessToken, params) {
    throw new Error('getFileContent() must be implemented by subclass');
  }

  /**
   * Validate that access token is still valid
   *
   * @param {string} accessToken - Access token to validate
   * @returns {Promise<boolean>} True if token is valid
   */
  async validateToken(accessToken) {
    try {
      await this.getUserProfile(accessToken);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get provider metadata (name, icon, etc.)
   *
   * @returns {object} Provider metadata
   */
  getMetadata() {
    return {
      name: this.providerName,
      displayName: this.providerName.charAt(0).toUpperCase() + this.providerName.slice(1),
      icon: `/${this.providerName}-icon.svg`, // Placeholder
      supportedScopes: [],
      supportsRefreshToken: false,
      supportsRevocation: false,
    };
  }
}
