/**
 * API Route: Connect GitLab Integration
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { initializeGitLab } from '@/lib/integrations/gitlab';

export async function POST(request) {
  try {
    const { projectId, gitlabProjectId, token } = await request.json();

    if (!projectId || !gitlabProjectId || !token) {
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

    const integrationData = await initializeGitLab(
      projectId,
      { gitlabProjectId, token },
      encryptionKey
    );

    const crypto = require('crypto');
    const webhookSecret = crypto.randomBytes(32).toString('hex');

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
      message: 'GitLab integration connected successfully',
      webhookUrl: `${process.env.NEXTAUTH_URL}/api/integrations/gitlab/webhook?project=${projectId}`,
      webhookSecret,
    });
  } catch (error) {
    console.error('GitLab connect error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect GitLab integration' },
      { status: 500 }
    );
  }
}
