/**
 * API Route: Sync GitHub Issues
 *
 * POST /api/integrations/github/sync
 * - Fetch issues from GitHub
 * - Create or update requirements in ORIZON
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getGitHubClient } from '@/lib/integrations/github';
import { createRequirement, updateRequirement } from '@/lib/db-requirements';

export async function POST(request) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Get project with integration config
    const projectResult = await query(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const project = projectResult.rows[0];

    if (project.integration_type !== 'github') {
      return NextResponse.json(
        { error: 'Project is not configured for GitHub integration' },
        { status: 400 }
      );
    }

    // Update sync status to 'syncing'
    await query(
      'UPDATE projects SET sync_status = $1 WHERE id = $2',
      ['syncing', projectId]
    );

    const encryptionKey = process.env.ENCRYPTION_KEY;
    const client = getGitHubClient(project, encryptionKey);

    // Fetch all issues
    const issues = await client.getIssues('all');

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const issue of issues) {
      try {
        const requirementData = client.mapIssueToRequirement(issue);

        // Check if requirement already exists
        const existingResult = await query(
          'SELECT id FROM requirements WHERE project_id = $1 AND external_id = $2',
          [projectId, requirementData.external_id]
        );

        if (existingResult.rows.length > 0) {
          // Update existing requirement
          const reqId = existingResult.rows[0].id;
          await updateRequirement(reqId, {
            ...requirementData,
            sync_status: 'synced',
            last_synced_at: new Date(),
          });
          updated++;
        } else {
          // Create new requirement
          await createRequirement({
            project_id: projectId,
            ...requirementData,
            sync_status: 'synced',
            last_synced_at: new Date(),
            created_by: project.owner_id,
          });
          created++;
        }
      } catch (err) {
        console.error(`Error syncing issue ${issue.number}:`, err);
        errors++;
      }
    }

    // Update sync status and timestamp
    await query(
      'UPDATE projects SET sync_status = $1, last_sync_at = NOW() WHERE id = $2',
      ['idle', projectId]
    );

    return NextResponse.json({
      success: true,
      message: 'GitHub sync completed',
      stats: {
        total: issues.length,
        created,
        updated,
        errors,
      },
    });
  } catch (error) {
    console.error('GitHub sync error:', error);

    // Update sync status to 'error'
    if (request.body?.projectId) {
      await query(
        'UPDATE projects SET sync_status = $1 WHERE id = $2',
        ['error', request.body.projectId]
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to sync GitHub issues' },
      { status: 500 }
    );
  }
}
