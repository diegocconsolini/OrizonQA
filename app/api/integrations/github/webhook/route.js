/**
 * API Route: GitHub Webhook Handler
 *
 * POST /api/integrations/github/webhook?project=<projectId>
 * - Receive webhook events from GitHub
 * - Process issues, pull requests, pushes, and workflow runs
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { parseWebhookEvent, getGitHubClient, formatTestResultsComment } from '@/lib/integrations/github';
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

    if (project.integration_type !== 'github') {
      return NextResponse.json(
        { error: 'Project is not configured for GitHub integration' },
        { status: 400 }
      );
    }

    // Parse webhook payload
    const payload = await request.json();
    const eventType = request.headers.get('x-github-event');

    // Log webhook event
    await query(
      `INSERT INTO webhook_events (project_id, source, event_type, payload, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      [projectId, 'github', eventType, JSON.stringify(payload)]
    );

    // Parse event
    const event = parseWebhookEvent(payload);

    // Process event based on type
    switch (event.type) {
      case 'issue':
        await handleIssueEvent(project, event);
        break;

      case 'pull_request':
        await handlePullRequestEvent(project, event);
        break;

      case 'push':
        await handlePushEvent(project, event);
        break;

      case 'workflow_run':
        await handleWorkflowRunEvent(project, event);
        break;

      default:
        console.log(`Unhandled GitHub event type: ${event.type}`);
    }

    // Mark webhook event as processed
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
    console.error('GitHub webhook error:', error);

    // Log error in webhook event
    if (request.body?.projectId && request.headers?.get('x-github-event')) {
      await query(
        `UPDATE webhook_events
         SET error = $1
         WHERE project_id = $2 AND event_type = $3
         ORDER BY created_at DESC LIMIT 1`,
        [error.message, request.body.projectId, request.headers.get('x-github-event')]
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

/**
 * Handle issue opened/edited/closed events
 */
async function handleIssueEvent(project, event) {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  const client = getGitHubClient(project, encryptionKey);

  const issue = event.issue;
  const requirementData = client.mapIssueToRequirement(issue);

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
  } else if (event.action === 'opened') {
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
 * Handle pull request opened/closed events
 */
async function handlePullRequestEvent(project, event) {
  const pr = event.pullRequest;

  // Create test run triggered by PR
  if (event.action === 'opened' || event.action === 'synchronize') {
    await query(
      `INSERT INTO test_runs (
        project_id, name, status, triggered_by, external_run_id,
        build_info, started_at, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        project.id,
        `PR #${pr.number}: ${pr.title}`,
        'Not Started',
        'ci_cd',
        `pr-${pr.number}`,
        JSON.stringify({
          pr_number: pr.number,
          pr_title: pr.title,
          branch: pr.head.ref,
          commit_sha: pr.head.sha,
          author: pr.user.login,
        }),
        pr.created_at,
      ]
    );
  }
}

/**
 * Handle push events
 */
async function handlePushEvent(project, event) {
  const ref = event.ref;
  const branch = ref.replace('refs/heads/', '');

  // Store git commits
  for (const commit of event.commits || []) {
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

      // Parse commit message for entity references
      const message = commit.message || '';
      const reqMatches = message.match(/GH-\d+|#\d+/gi) || [];
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

/**
 * Handle workflow run completed events
 */
async function handleWorkflowRunEvent(project, event) {
  if (event.action !== 'completed') return;

  const workflowRun = event.workflowRun;

  // Create test run triggered by GitHub Actions
  await query(
    `INSERT INTO test_runs (
      project_id, name, status, triggered_by, external_run_id,
      build_info, started_at, completed_at, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
    [
      project.id,
      `${workflowRun.name} #${workflowRun.run_number}`,
      workflowRun.conclusion === 'success' ? 'Passed' : 'Failed',
      'ci_cd',
      workflowRun.id,
      JSON.stringify({
        workflow_id: workflowRun.workflow_id,
        workflow_name: workflowRun.name,
        run_number: workflowRun.run_number,
        branch: workflowRun.head_branch,
        commit_sha: workflowRun.head_sha,
        conclusion: workflowRun.conclusion,
        html_url: workflowRun.html_url,
      }),
      workflowRun.created_at,
      workflowRun.updated_at,
    ]
  );
}
