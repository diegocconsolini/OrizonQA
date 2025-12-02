/**
 * OAuth Connections Database Helper
 *
 * CRUD operations for oauth_connections table.
 * Handles encrypted token storage and retrieval.
 *
 * Usage:
 *   import * as oauthDb from '@/lib/db-oauth-connections';
 *
 *   await oauthDb.createConnection({ userId, provider, ... });
 *   const connections = await oauthDb.getConnectionsByUser(userId);
 */

import { query } from '@/lib/db.js';
import { encryptToken, decryptToken } from '@/lib/oauth/encryption.js';

/**
 * Create a new OAuth connection
 *
 * @param {object} data - Connection data
 * @param {number} data.userId - User ID
 * @param {string} data.provider - Provider name ('github', 'gitlab', etc.)
 * @param {string} data.providerUserId - User ID from provider
 * @param {string} data.providerUsername - Username from provider
 * @param {string} data.accessToken - Access token (will be encrypted)
 * @param {string} [data.refreshToken] - Refresh token (will be encrypted)
 * @param {Date} [data.tokenExpiresAt] - Token expiration timestamp
 * @param {string[]} data.scopes - Granted OAuth scopes
 * @param {object} [data.metadata] - Provider-specific metadata
 * @returns {Promise<object>} Created connection
 */
export async function createConnection(data) {
  const {
    userId,
    provider,
    providerUserId,
    providerUsername,
    accessToken,
    refreshToken = null,
    tokenExpiresAt = null,
    scopes = [],
    metadata = {},
  } = data;

  // Encrypt tokens
  const accessTokenEncrypted = encryptToken(accessToken);
  const refreshTokenEncrypted = refreshToken ? encryptToken(refreshToken) : null;

  const result = await query(
    `INSERT INTO oauth_connections (
      user_id,
      provider,
      provider_user_id,
      provider_username,
      access_token_encrypted,
      refresh_token_encrypted,
      token_expires_at,
      scopes,
      metadata,
      status,
      last_used_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', NOW())
    ON CONFLICT (user_id, provider, provider_user_id)
    DO UPDATE SET
      provider_username = EXCLUDED.provider_username,
      access_token_encrypted = EXCLUDED.access_token_encrypted,
      refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
      token_expires_at = EXCLUDED.token_expires_at,
      scopes = EXCLUDED.scopes,
      metadata = EXCLUDED.metadata,
      status = 'active',
      last_used_at = NOW(),
      updated_at = NOW()
    RETURNING *`,
    [
      userId,
      provider,
      providerUserId,
      providerUsername,
      accessTokenEncrypted,
      refreshTokenEncrypted,
      tokenExpiresAt,
      JSON.stringify(scopes),
      JSON.stringify(metadata),
    ]
  );

  const connection = result.rows[0];

  // Decrypt tokens before returning
  return {
    ...connection,
    access_token: decryptToken(connection.access_token_encrypted),
    refresh_token: connection.refresh_token_encrypted
      ? decryptToken(connection.refresh_token_encrypted)
      : null,
    scopes: connection.scopes,
    metadata: connection.metadata,
  };
}

/**
 * Get all OAuth connections for a user
 *
 * @param {number} userId - User ID
 * @param {string} [provider] - Filter by provider (optional)
 * @returns {Promise<Array>} Array of connections (tokens decrypted)
 */
export async function getConnectionsByUser(userId, provider = null) {
  const sql = provider
    ? 'SELECT * FROM oauth_connections WHERE user_id = $1 AND provider = $2 AND status = $3'
    : 'SELECT * FROM oauth_connections WHERE user_id = $1 AND status = $2';

  const params = provider ? [userId, provider, 'active'] : [userId, 'active'];

  const result = await query(sql, params);

  return result.rows.map(conn => ({
    ...conn,
    access_token: decryptToken(conn.access_token_encrypted),
    refresh_token: conn.refresh_token_encrypted
      ? decryptToken(conn.refresh_token_encrypted)
      : null,
    scopes: conn.scopes,
    metadata: conn.metadata,
  }));
}

/**
 * Get a specific OAuth connection by ID
 *
 * @param {number} connectionId - Connection ID
 * @param {number} userId - User ID (for permission check)
 * @returns {Promise<object|null>} Connection or null
 */
export async function getConnectionById(connectionId, userId) {
  const result = await query(
    'SELECT * FROM oauth_connections WHERE id = $1 AND user_id = $2',
    [connectionId, userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const conn = result.rows[0];

  return {
    ...conn,
    access_token: decryptToken(conn.access_token_encrypted),
    refresh_token: conn.refresh_token_encrypted
      ? decryptToken(conn.refresh_token_encrypted)
      : null,
    scopes: conn.scopes,
    metadata: conn.metadata,
  };
}

/**
 * Update OAuth connection (e.g., refresh token)
 *
 * @param {number} connectionId - Connection ID
 * @param {number} userId - User ID (for permission check)
 * @param {object} updates - Fields to update
 * @param {string} [updates.accessToken] - New access token
 * @param {string} [updates.refreshToken] - New refresh token
 * @param {Date} [updates.tokenExpiresAt] - New expiration
 * @param {string} [updates.status] - Connection status
 * @returns {Promise<boolean>} True if updated
 */
export async function updateConnection(connectionId, userId, updates) {
  const { accessToken, refreshToken, tokenExpiresAt, status } = updates;

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (accessToken) {
    fields.push(`access_token_encrypted = $${paramIndex++}`);
    values.push(encryptToken(accessToken));
  }

  if (refreshToken !== undefined) {
    fields.push(`refresh_token_encrypted = $${paramIndex++}`);
    values.push(refreshToken ? encryptToken(refreshToken) : null);
  }

  if (tokenExpiresAt !== undefined) {
    fields.push(`token_expires_at = $${paramIndex++}`);
    values.push(tokenExpiresAt);
  }

  if (status) {
    fields.push(`status = $${paramIndex++}`);
    values.push(status);
  }

  if (fields.length === 0) {
    return false;
  }

  fields.push(`updated_at = NOW()`);
  values.push(connectionId, userId);

  const result = await query(
    `UPDATE oauth_connections
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
     RETURNING id`,
    values
  );

  return result.rows.length > 0;
}

/**
 * Update last_used_at timestamp
 *
 * @param {number} connectionId - Connection ID
 * @returns {Promise<void>}
 */
export async function touchConnection(connectionId) {
  await query(
    'UPDATE oauth_connections SET last_used_at = NOW() WHERE id = $1',
    [connectionId]
  );
}

/**
 * Delete an OAuth connection (revoke)
 *
 * @param {number} connectionId - Connection ID
 * @param {number} userId - User ID (for permission check)
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteConnection(connectionId, userId) {
  const result = await query(
    'DELETE FROM oauth_connections WHERE id = $1 AND user_id = $2 RETURNING id',
    [connectionId, userId]
  );

  return result.rows.length > 0;
}

/**
 * Mark connection as expired
 *
 * @param {number} connectionId - Connection ID
 * @returns {Promise<void>}
 */
export async function markConnectionExpired(connectionId) {
  await query(
    `UPDATE oauth_connections
     SET status = 'expired', updated_at = NOW()
     WHERE id = $1`,
    [connectionId]
  );
}

/**
 * Mark connection as error
 *
 * @param {number} connectionId - Connection ID
 * @param {string} errorMessage - Error details
 * @returns {Promise<void>}
 */
export async function markConnectionError(connectionId, errorMessage) {
  await query(
    `UPDATE oauth_connections
     SET status = 'error',
         metadata = jsonb_set(metadata, '{last_error}', $2, true),
         updated_at = NOW()
     WHERE id = $1`,
    [connectionId, JSON.stringify(errorMessage)]
  );
}

/**
 * Get connections that need token refresh
 *
 * @param {number} [hoursBeforeExpiry=24] - Refresh tokens expiring within N hours
 * @returns {Promise<Array>} Connections needing refresh
 */
export async function getConnectionsNeedingRefresh(hoursBeforeExpiry = 24) {
  const result = await query(
    `SELECT *
     FROM oauth_connections
     WHERE status = 'active'
       AND token_expires_at IS NOT NULL
       AND token_expires_at <= NOW() + INTERVAL '${hoursBeforeExpiry} hours'
       AND refresh_token_encrypted IS NOT NULL`,
    []
  );

  return result.rows.map(conn => ({
    ...conn,
    access_token: decryptToken(conn.access_token_encrypted),
    refresh_token: decryptToken(conn.refresh_token_encrypted),
    scopes: conn.scopes,
    metadata: conn.metadata,
  }));
}
