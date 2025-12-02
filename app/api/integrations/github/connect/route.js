/**
 * API Route: Connect GitHub Integration
 *
 * POST /api/integrations/github/connect
 * - Initialize GitHub integration for a project
 * - Test connection and store encrypted config
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { initializeGitHub } from '@/lib/integrations/github';

export async function POST(request) {
  try {
    const { projectId, owner, repo, token } = await request.json();

    if (!projectId || !owner || !repo || !token) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      return NextResponse.json(
        { error: 'Server encryption key not configured' },
        { status: 500 }
      );
    }

    // Initialize GitHub integration (tests connection)
    const integrationData = await initializeGitHub(
      projectId,
      { owner, repo, token },
      encryptionKey
    );

    // Generate webhook secret
    const crypto = require('crypto');
    const webhookSecret = crypto.randomBytes(32).toString('hex');

    // Update project with integration config
    await query(
      `UPDATE projects
       SET integration_type = $1,
           integration_config = $2,
           webhook_secret = $3,
           sync_status = $4,
           last_sync_at = NULL
       WHERE id = $5`,
      [
        integrationData.integration_type,
        JSON.stringify(integrationData.integration_config),
        webhookSecret,
        integrationData.sync_status,
        projectId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'GitHub integration connected successfully',
      webhookUrl: `${process.env.NEXTAUTH_URL}/api/integrations/github/webhook?project=${projectId}`,
      webhookSecret,
    });
  } catch (error) {
    console.error('GitHub connect error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect GitHub integration' },
      { status: 500 }
    );
  }
}
