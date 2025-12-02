/**
 * API Route: GitLab Webhook Handler
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { parseWebhookEvent, getGitLabClient, validateWebhookToken } from '@/lib/integrations/gitlab';
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

    const payload = await request.json();
    const eventType = payload.object_kind;

    await query(
      `INSERT INTO webhook_events (project_id, source, event_type, payload, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      [projectId, 'gitlab', eventType, JSON.stringify(payload)]
    );

    const event = parseWebhookEvent(payload);

    switch (event.type) {
      case 'issue':
        await handleIssueEvent(project, event);
        break;

      case 'merge_request':
        await handleMergeRequestEvent(project, event);
        break;

      case 'push':
        await handlePushEvent(project, event);
        break;

      case 'pipeline':
        await handlePipelineEvent(project, event);
        break;

      default:
        console.log(`Unhandled GitLab event type: ${event.type}`);
    }

    await query(
      `UPDATE webhook_events
       SET processed = true, processed_at = NOW()
       WHERE project_id = $1 AND event_type = $2
       ORDER BY created_at DESC LIMIT 1`,
      [projectId, eventType]
    );

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    console.error('GitLab webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function handleIssueEvent(project, event) {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  const client = getGitLabClient(project, encryptionKey);

  const issue = event.issue;
  const requirementData = client.mapIssueToRequirement(issue);

  const existingResult = await query(
    'SELECT id FROM requirements WHERE project_id = $1 AND external_id = $2',
    [project.id, requirementData.external_id]
  );

  if (existingResult.rows.length > 0) {
    const reqId = existingResult.rows[0].id;
    await updateRequirement(reqId, {
      ...requirementData,
      sync_status: 'synced',
      last_synced_at: new Date(),
    });
  } else if (event.action === 'open') {
    await createRequirement({
      project_id: project.id,
      ...requirementData,
      sync_status: 'synced',
      last_synced_at: new Date(),
      created_by: project.owner_id,
    });
  }
}

async function handleMergeRequestEvent(project, event) {
  const mr = event.mergeRequest;

  if (event.action === 'open' || event.action === 'update') {
    await query(
      `INSERT INTO test_runs (
        project_id, name, status, triggered_by, external_run_id,
        build_info, started_at, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        project.id,
        `MR !${mr.iid}: ${mr.title}`,
        'Not Started',
        'ci_cd',
        `mr-${mr.iid}`,
        JSON.stringify({
          mr_iid: mr.iid,
          mr_title: mr.title,
          branch: mr.source_branch,
          commit_sha: mr.last_commit.id,
        }),
        mr.created_at,
      ]
    );
  }
}

async function handlePushEvent(project, event) {
  const ref = event.ref;
  const branch = ref.replace('refs/heads/', '');

  for (const commit of event.commits || []) {
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
        commit.id,
        branch,
        commit.author.name,
        commit.author.email,
        commit.message,
        commit.timestamp,
      ]
    );

    if (commitResult.rows.length > 0) {
      const commitId = commitResult.rows[0].id;
      const message = commit.message || '';
      const reqMatches = message.match(/GL-\d+|#\d+/gi) || [];

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
    }
  }
}

async function handlePipelineEvent(project, event) {
  if (event.action !== 'success' && event.action !== 'failed') return;

  const pipeline = event.pipeline;

  await query(
    `INSERT INTO test_runs (
      project_id, name, status, triggered_by, external_run_id,
      build_info, started_at, completed_at, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
    [
      project.id,
      `Pipeline #${pipeline.id}`,
      event.action === 'success' ? 'Passed' : 'Failed',
      'ci_cd',
      pipeline.id,
      JSON.stringify({
        pipeline_id: pipeline.id,
        branch: pipeline.ref,
        commit_sha: pipeline.sha,
        status: pipeline.status,
      }),
      pipeline.created_at,
      pipeline.finished_at,
    ]
  );
}
