/**
 * API Route: Disconnect Azure DevOps Integration
 *
 * POST /api/integrations/azure-devops/disconnect
 * - Remove Azure DevOps integration from a project
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Clear integration config
    await query(
      `UPDATE projects
       SET integration_type = NULL,
           integration_config = NULL,
           webhook_secret = NULL,
           sync_status = 'idle',
           last_sync_at = NULL
       WHERE id = $1`,
      [projectId]
    );

    return NextResponse.json({
      success: true,
      message: 'Azure DevOps integration disconnected successfully',
    });
  } catch (error) {
    console.error('Azure DevOps disconnect error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect Azure DevOps integration' },
      { status: 500 }
    );
  }
}
