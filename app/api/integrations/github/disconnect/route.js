/**
 * API Route: Disconnect GitHub Integration
 *
 * POST /api/integrations/github/disconnect
 * - Remove GitHub integration from a project
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
      message: 'GitHub integration disconnected successfully',
    });
  } catch (error) {
    console.error('GitHub disconnect error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect GitHub integration' },
      { status: 500 }
    );
  }
}
