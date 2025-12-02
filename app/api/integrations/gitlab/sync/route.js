/**
 * API Route: Sync GitLab Issues
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getGitLabClient } from '@/lib/integrations/gitlab';
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

    if (project.integration_type !== 'gitlab') {
      return NextResponse.json(
        { error: 'Project is not configured for GitLab integration' },
        { status: 400 }
      );
    }

    await query(
      'UPDATE projects SET sync_status = $1 WHERE id = $2',
      ['syncing', projectId]
    );

    const encryptionKey = process.env.ENCRYPTION_KEY;
    const client = getGitLabClient(project, encryptionKey);

    const issues = await client.getIssues('all');

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const issue of issues) {
      try {
        const requirementData = client.mapIssueToRequirement(issue);

        const existingResult = await query(
          'SELECT id FROM requirements WHERE project_id = $1 AND external_id = $2',
          [projectId, requirementData.external_id]
        );

        if (existingResult.rows.length > 0) {
          const reqId = existingResult.rows[0].id;
          await updateRequirement(reqId, {
            ...requirementData,
            sync_status: 'synced',
            last_synced_at: new Date(),
          });
          updated++;
        } else {
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
        console.error(`Error syncing issue ${issue.iid}:`, err);
        errors++;
      }
    }

    await query(
      'UPDATE projects SET sync_status = $1, last_sync_at = NOW() WHERE id = $2',
      ['idle', projectId]
    );

    return NextResponse.json({
      success: true,
      message: 'GitLab sync completed',
      stats: {
        total: issues.length,
        created,
        updated,
        errors,
      },
    });
  } catch (error) {
    console.error('GitLab sync error:', error);

    if (request.body?.projectId) {
      await query(
        'UPDATE projects SET sync_status = $1 WHERE id = $2',
        ['error', request.body.projectId]
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to sync GitLab issues' },
      { status: 500 }
    );
  }
}
