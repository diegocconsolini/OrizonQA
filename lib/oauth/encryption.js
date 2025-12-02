/**
 * OAuth Token Encryption Utility
 *
 * Shared encryption/decryption functions for OAuth access tokens.
 * Uses AES-256-GCM (same algorithm as Claude API key encryption).
 *
 * Features:
 * - AES-256-GCM symmetric encryption
 * - Random IV for each encryption
 * - Authentication tag for integrity verification
 * - JSON storage format: { encrypted, iv, authTag }
 *
 * Usage:
 *   import { encryptToken, decryptToken } from '@/lib/oauth/encryption';
 *
 *   const encrypted = encryptToken('github_pat_xxx');
 *   const decrypted = decryptToken(encrypted);
 */

import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

/**
 * Validate that encryption key is configured
 * @throws {Error} If ENCRYPTION_KEY is not set
 */
function validateEncryptionKey() {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  if (ENCRYPTION_KEY.length < 64) {
    throw new Error('ENCRYPTION_KEY must be at least 32 bytes (64 hex characters)');
  }
}

/**
 * Encrypt an OAuth token
 *
 * @param {string} text - Plain text token to encrypt
 * @returns {string} JSON string containing { encrypted, iv, authTag }
 * @throws {Error} If encryption fails or ENCRYPTION_KEY is not set
 */
export function encryptToken(text) {
  if (!text) {
    throw new Error('Token cannot be empty');
  }

  validateEncryptionKey();

  try {
    // Generate random IV (Initialization Vector)
    const iv = crypto.randomBytes(16);

    // Convert hex key to Buffer (first 32 bytes = 64 hex chars)
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Return JSON string
    return JSON.stringify({
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    });
  } catch (error) {
    console.error('Token encryption failed:', error.message);
    throw new Error('Failed to encrypt token');
  }
}

/**
 * Decrypt an OAuth token
 *
 * @param {string} encryptedData - JSON string from encryptToken()
 * @returns {string|null} Decrypted token, or null if decryption fails
 */
export function decryptToken(encryptedData) {
  if (!encryptedData) {
    return null;
  }

  validateEncryptionKey();

  try {
    // Parse JSON
    const { encrypted, iv, authTag } = JSON.parse(encryptedData);

    // Convert hex key to Buffer
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');

    // Create decipher
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    );

    // Set authentication tag
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Token decryption failed:', error.message);
    return null;
  }
}

/**
 * Check if encrypted data is valid (can be decrypted)
 *
 * @param {string} encryptedData - JSON string to validate
 * @returns {boolean} True if valid and decryptable
 */
export function isValidEncryptedToken(encryptedData) {
  if (!encryptedData) {
    return false;
  }

  try {
    const decrypted = decryptToken(encryptedData);
    return decrypted !== null && decrypted.length > 0;
  } catch {
    return false;
  }
}

/**
 * Generate a random encryption key (for development/setup)
 * WARNING: Only use this for generating NEW keys, not in production code
 *
 * @returns {string} 64-character hex string (32 bytes)
 */
export function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}
