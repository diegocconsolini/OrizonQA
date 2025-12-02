/**
 * API Route: Azure DevOps Webhook Handler
 *
 * POST /api/integrations/azure-devops/webhook?project=<projectId>
 * - Receive webhook events from Azure DevOps
 * - Process work item updates, builds, and git pushes
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { parseWebhookEvent, getAzureDevOpsClient } from '@/lib/integrations/azure-devops';
import { createRequirement, updateRequirement } from '@/lib/db-requirements';

export async function POST(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('project');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Get project
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

    // Parse webhook payload
    const payload = await request.json();

    // Log webhook event
    await query(
      `INSERT INTO webhook_events (project_id, source, event_type, payload, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      [projectId, 'azure_devops', payload.eventType, JSON.stringify(payload)]
    );

    // Parse event
    const event = parseWebhookEvent(payload);

    // Process event based on type
    switch (event.type) {
      case 'work_item':
        await handleWorkItemEvent(project, event);
        break;

      case 'build':
        await handleBuildEvent(project, event);
        break;

      case 'git_push':
        await handleGitPushEvent(project, event);
        break;

      default:
        console.log(`Unhandled Azure DevOps event type: ${event.type}`);
    }

    // Mark webhook event as processed
    await query(
      `UPDATE webhook_events
       SET processed = true, processed_at = NOW()
       WHERE project_id = $1 AND event_type = $2
       ORDER BY created_at DESC LIMIT 1`,
      [projectId, payload.eventType]
    );

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    console.error('Azure DevOps webhook error:', error);

    // Log error in webhook event
    if (request.body?.projectId && request.body?.eventType) {
      await query(
        `UPDATE webhook_events
         SET error = $1
         WHERE project_id = $2 AND event_type = $3
         ORDER BY created_at DESC LIMIT 1`,
        [error.message, request.body.projectId, request.body.eventType]
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

/**
 * Handle work item created/updated events
 */
async function handleWorkItemEvent(project, event) {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  const client = getAzureDevOpsClient(project, encryptionKey);

  const workItem = event.workItem;
  const requirementData = client.mapWorkItemToRequirement(workItem);

  // Check if requirement exists
  const existingResult = await query(
    'SELECT id FROM requirements WHERE project_id = $1 AND external_id = $2',
    [project.id, requirementData.external_id]
  );

  if (existingResult.rows.length > 0) {
    // Update existing requirement
    const reqId = existingResult.rows[0].id;
    await updateRequirement(reqId, {
      ...requirementData,
      sync_status: 'synced',
      last_synced_at: new Date(),
    });
  } else if (event.action === 'created') {
    // Create new requirement
    await createRequirement({
      project_id: project.id,
      ...requirementData,
      sync_status: 'synced',
      last_synced_at: new Date(),
      created_by: project.owner_id,
    });
  }
}

/**
 * Handle build completed events
 */
async function handleBuildEvent(project, event) {
  const build = event.build;

  // Create test run triggered by CI/CD
  await query(
    `INSERT INTO test_runs (
      project_id, name, status, triggered_by, external_run_id,
      build_info, started_at, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      project.id,
      `Build ${build.buildNumber}`,
      'Not Started',
      'ci_cd',
      build.id,
      JSON.stringify({
        build_id: build.id,
        build_number: build.buildNumber,
        source_branch: build.sourceBranch,
        source_version: build.sourceVersion,
        reason: build.reason,
        status: build.status,
        result: build.result,
      }),
      build.startTime,
    ]
  );
}

/**
 * Handle git push events
 */
async function handleGitPushEvent(project, event) {
  const push = event.push;

  // Store git commits
  for (const commit of push.commits || []) {
    // Insert commit
    const commitResult = await query(
      `INSERT INTO git_commits (
        project_id, commit_sha, branch, author, author_email,
        message, committed_at, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (project_id, commit_sha) DO NOTHING
      RETURNING id`,
      [
        project.id,
        commit.commitId,
        push.refUpdates?.[0]?.name || 'unknown',
        commit.author?.name,
        commit.author?.email,
        commit.comment,
        commit.author?.date,
      ]
    );

    if (commitResult.rows.length > 0) {
      const commitId = commitResult.rows[0].id;

      // Parse commit message for entity references
      const message = commit.comment || '';
      const reqMatches = message.match(/REQ-\d+|#\d+/gi) || [];
      const testMatches = message.match(/TC-\d+/gi) || [];

      // Link commits to requirements
      for (const match of reqMatches) {
        const reqResult = await query(
          'SELECT id FROM requirements WHERE project_id = $1 AND (key = $2 OR external_id LIKE $3)',
          [project.id, match, `%${match}%`]
        );

        if (reqResult.rows.length > 0) {
          await query(
            `INSERT INTO commit_links (commit_id, entity_type, entity_id, created_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (commit_id, entity_type, entity_id) DO NOTHING`,
            [commitId, 'requirement', reqResult.rows[0].id]
          );
        }
      }

      // Link commits to test cases
      for (const match of testMatches) {
        const testResult = await query(
          'SELECT id FROM test_cases WHERE project_id = $1 AND key = $2',
          [project.id, match]
        );

        if (testResult.rows.length > 0) {
          await query(
            `INSERT INTO commit_links (commit_id, entity_type, entity_id, created_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (commit_id, entity_type, entity_id) DO NOTHING`,
            [commitId, 'test_case', testResult.rows[0].id]
          );
        }
      }
    }
  }
}
