import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { query } from '@/lib/db';
import crypto from 'crypto';

/**
 * Encryption helpers for API keys
 * Using AES-256-GCM for encryption
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const algorithm = 'aes-256-gcm';

function encrypt(text) {
  if (!text) return null;

  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return JSON.stringify({
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  });
}

function decrypt(encryptedData) {
  if (!encryptedData) return null;

  try {
    const { encrypted, iv, authTag } = JSON.parse(encryptedData);
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
    const decipher = crypto.createDecipheriv(
      algorithm,
      key,
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

/**
 * GET /api/user/settings
 *
 * Retrieve user settings (API keys, preferences)
 */
export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user settings from database
    const result = await query(
      'SELECT claude_api_key_encrypted, lmstudio_url, ai_provider FROM users WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Decrypt API key
    const claudeApiKey = decrypt(user.claude_api_key_encrypted);

    return NextResponse.json({
      claudeApiKey: claudeApiKey || '',
      lmStudioUrl: user.lmstudio_url || '',
      aiProvider: user.ai_provider || 'claude',
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/settings
 *
 * Save user settings
 */
export async function POST(request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { claudeApiKey, lmStudioUrl, aiProvider } = body;

    // Encrypt API key if provided
    const encryptedApiKey = claudeApiKey ? encrypt(claudeApiKey) : null;

    // Update user settings
    await query(
      `UPDATE users
       SET claude_api_key_encrypted = $1,
           lmstudio_url = $2,
           ai_provider = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [encryptedApiKey, lmStudioUrl || null, aiProvider || 'claude', userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
    });
  } catch (error) {
    console.error('Settings POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
