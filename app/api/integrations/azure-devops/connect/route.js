/**
 * API Route: Connect Azure DevOps Integration
 *
 * POST /api/integrations/azure-devops/connect
 * - Initialize Azure DevOps integration for a project
 * - Test connection and store encrypted config
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { initializeAzureDevOps } from '@/lib/integrations/azure-devops';

export async function POST(request) {
  try {
    const { projectId, organization, project, patToken } = await request.json();

    if (!projectId || !organization || !project || !patToken) {
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

    // Initialize Azure DevOps integration (tests connection)
    const integrationData = await initializeAzureDevOps(
      projectId,
      { organization, project, patToken },
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
      message: 'Azure DevOps integration connected successfully',
      webhookUrl: `${process.env.NEXTAUTH_URL}/api/integrations/azure-devops/webhook?project=${projectId}`,
      webhookSecret,
    });
  } catch (error) {
    console.error('Azure DevOps connect error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect Azure DevOps integration' },
      { status: 500 }
    );
  }
}
