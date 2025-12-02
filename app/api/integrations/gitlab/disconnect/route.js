/**
 * API Route: Disconnect GitLab Integration
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
      message: 'GitLab integration disconnected successfully',
    });
  } catch (error) {
    console.error('GitLab disconnect error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect GitLab integration' },
      { status: 500 }
    );
  }
}
