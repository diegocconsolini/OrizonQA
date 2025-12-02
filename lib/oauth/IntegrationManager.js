/**
 * Integration Manager
 *
 * Central orchestrator for OAuth provider integrations.
 * Manages the full OAuth lifecycle: connect, refresh, revoke.
 *
 * Features:
 * - Provider registry (GitHub, GitLab, Bitbucket)
 * - State parameter generation and validation (CSRF protection)
 * - Automatic token refresh
 * - Audit logging
 * - Connection management
 *
 * Usage:
 *   import IntegrationManager from '@/lib/oauth/IntegrationManager';
 *
 *   const manager = new IntegrationManager();
 *   const authUrl = await manager.initiateOAuth(userId, 'github', ['repo']);
 *   const connection = await manager.handleCallback(code, state);
 */

import crypto from 'crypto';
import GitHubAdapter from './adapters/GitHubAdapter.js';
import * as oauthDb from '@/lib/db-oauth-connections.js';
import { query } from '@/lib/db.js';

export default class IntegrationManager {
  constructor() {
    // Provider registry
    this.providers = {
      github: new GitHubAdapter(),
      // gitlab: new GitLabAdapter(),   // Future
      // bitbucket: new BitbucketAdapter(), // Future
    };
  }

  /**
   * Get provider adapter instance
   *
   * @param {string} providerName - Provider name ('github', 'gitlab', etc.)
   * @returns {OAuthProvider} Provider adapter
   */
  getProvider(providerName) {
    const provider = this.providers[providerName];

    if (!provider) {
      throw new Error(`Unknown OAuth provider: ${providerName}`);
    }

    return provider;
  }

  /**
   * Generate state parameter for CSRF protection
   *
   * State format: base64(userId:timestamp:randomBytes)
   *
   * @param {number} userId - User ID
   * @returns {string} State parameter
   */
  generateState(userId) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(16).toString('hex');
    const stateData = `${userId}:${timestamp}:${random}`;

    return Buffer.from(stateData).toString('base64url');
  }

  /**
   * Validate and parse state parameter
   *
   * @param {string} state - State parameter from callback
   * @param {number} maxAgeMinutes - Maximum age in minutes (default: 10)
   * @returns {{ userId: number, timestamp: number }} Parsed state
   * @throws {Error} If state is invalid or expired
   */
  validateState(state, maxAgeMinutes = 10) {
    try {
      const decoded = Buffer.from(state, 'base64url').toString('utf8');
      const [userId, timestamp, random] = decoded.split(':');

      if (!userId || !timestamp || !random) {
        throw new Error('Invalid state format');
      }

      const age = Date.now() - parseInt(timestamp, 10);
      const maxAge = maxAgeMinutes * 60 * 1000;

      if (age > maxAge) {
        throw new Error('State expired');
      }

      return {
        userId: parseInt(userId, 10),
        timestamp: parseInt(timestamp, 10),
      };
    } catch (error) {
      throw new Error(`State validation failed: ${error.message}`);
    }
  }

  /**
   * Initiate OAuth flow
   *
   * @param {number} userId - User ID
   * @param {string} providerName - Provider name ('github', 'gitlab', etc.)
   * @param {string[]} scopes - Requested OAuth scopes
   * @param {string} redirectUri - Callback URL
   * @returns {Promise<string>} Authorization URL to redirect user to
   */
  async initiateOAuth(userId, providerName, scopes, redirectUri) {
    const provider = this.getProvider(providerName);

    // Generate state for CSRF protection
    const state = this.generateState(userId);

    // Get authorization URL from provider
    const authUrl = await provider.getAuthorizationUrl({
      state,
      scopes,
      redirectUri,
    });

    // Log audit event
    await this.logAudit(userId, 'oauth.initiated', providerName, {
      scopes,
      redirectUri,
    });

    return authUrl;
  }

  /**
   * Handle OAuth callback (exchange code for token)
   *
   * @param {string} code - Authorization code
   * @param {string} state - State parameter (for validation)
   * @param {string} providerName - Provider name
   * @param {string} redirectUri - Callback URL (must match)
   * @returns {Promise<object>} Created connection
   */
  async handleCallback(code, state, providerName, redirectUri) {
    // Validate state parameter
    const { userId } = this.validateState(state);

    // Get provider adapter
    const provider = this.getProvider(providerName);

    try {
      // Exchange code for access token
      const tokenData = await provider.exchangeCodeForToken({
        code,
        redirectUri,
      });

      // Get user profile from provider
      const profile = await provider.getUserProfile(tokenData.access_token);

      // Calculate token expiration
      const tokenExpiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null;

      // Save connection to database
      const connection = await oauthDb.createConnection({
        userId,
        provider: providerName,
        providerUserId: profile.id,
        providerUsername: profile.username,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        tokenExpiresAt,
        scopes: tokenData.scope || [],
        metadata: {
          email: profile.email,
          name: profile.name,
          avatar_url: profile.avatar_url,
          connected_at: new Date().toISOString(),
        },
      });

      // Log audit event
      await this.logAudit(userId, 'oauth.connected', providerName, {
        connectionId: connection.id,
        username: profile.username,
        scopes: tokenData.scope,
      });

      return connection;
    } catch (error) {
      // Log failed connection
      await this.logAudit(userId, 'oauth.connection_failed', providerName, {
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Refresh an expired access token
   *
   * @param {number} connectionId - Connection ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if refreshed successfully
   */
  async refreshToken(connectionId, userId) {
    // Get connection
    const connection = await oauthDb.getConnectionById(connectionId, userId);

    if (!connection) {
      throw new Error('Connection not found');
    }

    if (!connection.refresh_token) {
      throw new Error('No refresh token available');
    }

    const provider = this.getProvider(connection.provider);

    try {
      // Refresh token via provider
      const tokenData = await provider.refreshAccessToken(connection.refresh_token);

      // Calculate new expiration
      const tokenExpiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null;

      // Update connection
      await oauthDb.updateConnection(connectionId, userId, {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || connection.refresh_token,
        tokenExpiresAt,
        status: 'active',
      });

      // Log audit event
      await this.logAudit(userId, 'oauth.token_refreshed', connection.provider, {
        connectionId,
      });

      return true;
    } catch (error) {
      // Mark connection as expired
      await oauthDb.markConnectionExpired(connectionId);

      // Log audit event
      await this.logAudit(userId, 'oauth.refresh_failed', connection.provider, {
        connectionId,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Revoke OAuth connection
   *
   * @param {number} connectionId - Connection ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if revoked successfully
   */
  async revokeConnection(connectionId, userId) {
    // Get connection
    const connection = await oauthDb.getConnectionById(connectionId, userId);

    if (!connection) {
      throw new Error('Connection not found');
    }

    const provider = this.getProvider(connection.provider);

    try {
      // Revoke token at provider (optional, not all providers support this)
      await provider.revokeAccessToken(connection.access_token);
    } catch (error) {
      console.warn(`Token revocation at ${connection.provider} failed:`, error.message);
    }

    // Delete connection from database
    await oauthDb.deleteConnection(connectionId, userId);

    // Log audit event
    await this.logAudit(userId, 'oauth.disconnected', connection.provider, {
      connectionId,
      username: connection.provider_username,
    });

    return true;
  }

  /**
   * Get user's OAuth connections
   *
   * @param {number} userId - User ID
   * @param {string} [providerName] - Filter by provider (optional)
   * @returns {Promise<Array>} Array of connections
   */
  async getUserConnections(userId, providerName = null) {
    return await oauthDb.getConnectionsByUser(userId, providerName);
  }

  /**
   * List repositories for a connection
   *
   * @param {number} connectionId - Connection ID
   * @param {number} userId - User ID
   * @param {object} [options] - Listing options
   * @returns {Promise<Array>} Array of repositories
   */
  async listRepositories(connectionId, userId, options = {}) {
    const connection = await oauthDb.getConnectionById(connectionId, userId);

    if (!connection) {
      throw new Error('Connection not found');
    }

    const provider = this.getProvider(connection.provider);

    // Update last_used_at
    await oauthDb.touchConnection(connectionId);

    return await provider.listRepositories(connection.access_token, options);
  }

  /**
   * Get repository contents
   *
   * @param {number} connectionId - Connection ID
   * @param {number} userId - User ID
   * @param {object} params - Repository parameters
   * @returns {Promise<Array>} Array of files/directories
   */
  async getRepositoryContents(connectionId, userId, params) {
    const connection = await oauthDb.getConnectionById(connectionId, userId);

    if (!connection) {
      throw new Error('Connection not found');
    }

    const provider = this.getProvider(connection.provider);

    // Update last_used_at
    await oauthDb.touchConnection(connectionId);

    return await provider.getRepositoryContents(connection.access_token, params);
  }

  /**
   * Log audit event
   *
   * @param {number} userId - User ID
   * @param {string} action - Action name
   * @param {string} provider - Provider name
   * @param {object} details - Additional details
   */
  async logAudit(userId, action, provider, details = {}) {
    try {
      await query(
        `INSERT INTO audit_logs (user_id, action, resource_type, metadata, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          userId,
          action,
          `oauth:${provider}`,
          JSON.stringify(details),
        ]
      );
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }

  /**
   * Auto-refresh tokens that are expiring soon
   *
   * @param {number} [hoursBeforeExpiry=24] - Refresh tokens expiring within N hours
   * @returns {Promise<object>} Stats about refresh operations
   */
  async autoRefreshTokens(hoursBeforeExpiry = 24) {
    const connections = await oauthDb.getConnectionsNeedingRefresh(hoursBeforeExpiry);

    const stats = {
      total: connections.length,
      success: 0,
      failed: 0,
    };

    for (const connection of connections) {
      try {
        await this.refreshToken(connection.id, connection.user_id);
        stats.success++;
      } catch (error) {
        console.error(`Auto-refresh failed for connection ${connection.id}:`, error);
        stats.failed++;
      }
    }

    return stats;
  }
}
