/**
 * API Route: Sync Azure DevOps Work Items
 *
 * POST /api/integrations/azure-devops/sync
 * - Fetch work items from Azure DevOps
 * - Create or update requirements in ORIZON
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAzureDevOpsClient } from '@/lib/integrations/azure-devops';
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

    if (project.integration_type !== 'azure_devops') {
      return NextResponse.json(
        { error: 'Project is not configured for Azure DevOps integration' },
        { status: 400 }
      );
    }

    // Update sync status to 'syncing'
    await query(
      'UPDATE projects SET sync_status = $1 WHERE id = $2',
      ['syncing', projectId]
    );

    const encryptionKey = process.env.ENCRYPTION_KEY;
    const client = getAzureDevOpsClient(project, encryptionKey);

    // Fetch all work items
    const workItems = await client.getAllWorkItems();

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const workItem of workItems) {
      try {
        const requirementData = client.mapWorkItemToRequirement(workItem);

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
        console.error(`Error syncing work item ${workItem.id}:`, err);
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
      message: 'Azure DevOps sync completed',
      stats: {
        total: workItems.length,
        created,
        updated,
        errors,
      },
    });
  } catch (error) {
    console.error('Azure DevOps sync error:', error);

    // Update sync status to 'error'
    if (request.body?.projectId) {
      await query(
        'UPDATE projects SET sync_status = $1 WHERE id = $2',
        ['error', request.body.projectId]
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to sync Azure DevOps work items' },
      { status: 500 }
    );
  }
}
