import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL
});

async function seedLargeProjects() {
  try {
    // Get user ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['diegocavalariconsolini@gmail.com']
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      process.exit(1);
    }

    const userId = userResult.rows[0].id;

    // SMALL PROJECT (5 requirements, 10 test cases)
    const smallProject = {
      name: 'Landing Page Builder',
      key: 'LAND',
      description: 'Simple drag-and-drop landing page builder for marketing campaigns',
      reqCount: 5,
      testCount: 10
    };

    // MEDIUM PROJECT (25 requirements, 50 test cases)
    const mediumProject = {
      name: 'Customer Support Platform',
      key: 'SUPPORT',
      description: 'Multi-channel customer support system with ticketing, live chat, and knowledge base',
      reqCount: 25,
      testCount: 50
    };

    // LARGE PROJECT (100 requirements, 200 test cases)
    const largeProject = {
      name: 'Enterprise ERP System',
      key: 'ERP',
      description: 'Comprehensive enterprise resource planning system covering finance, HR, inventory, sales, and supply chain',
      reqCount: 100,
      testCount: 200
    };

    const projects = [smallProject, mediumProject, largeProject];

    for (const projectData of projects) {
      console.log(`\n📦 Creating ${projectData.name}...`);

      // Check if exists
      const existing = await pool.query(
        'SELECT id FROM projects WHERE key = $1',
        [projectData.key]
      );

      if (existing.rows.length > 0) {
        console.log(`⚠ Project "${projectData.key}" already exists, skipping...`);
        continue;
      }

      // Create project
      const result = await pool.query(`
        INSERT INTO projects (name, key, description, owner_id, settings)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, key
      `, [
        projectData.name,
        projectData.key,
        projectData.description,
        userId,
        JSON.stringify({ testFramework: 'Jest', cicdEnabled: true })
      ]);

      const projectId = result.rows[0].id;
      console.log(`✓ Created project: ${result.rows[0].name} (${result.rows[0].key})`);

      // Add owner as Admin
      await pool.query(`
        INSERT INTO project_members (project_id, user_id, role, added_by)
        VALUES ($1, $2, 'Admin', $3)
      `, [projectId, userId, userId]);

      // Generate requirements
      const modules = [
        'Authentication', 'User Management', 'Dashboard', 'Reports',
        'Settings', 'Notifications', 'API', 'Integration',
        'Security', 'Analytics', 'Billing', 'Search',
        'File Management', 'Workflow', 'Audit', 'Export'
      ];

      const types = ['Story', 'Task', 'Bug', 'Epic'];
      const priorities = ['Low', 'Medium', 'High', 'Critical'];
      const statuses = ['Open', 'In Progress', 'In Review', 'Done'];

      console.log(`  → Generating ${projectData.reqCount} requirements...`);

      for (let i = 1; i <= projectData.reqCount; i++) {
        const module = modules[Math.floor(Math.random() * modules.length)];
        const type = types[Math.floor(Math.random() * types.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        await pool.query(`
          INSERT INTO requirements (
            project_id, key, title, description, type, status, priority, created_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          projectId,
          `${projectData.key}-${i}`,
          `${module} - Requirement ${i}`,
          `Implement ${module.toLowerCase()} functionality for requirement ${i}. This includes validation, error handling, and proper user feedback.`,
          type,
          status,
          priority,
          userId
        ]);

        if (i % 20 === 0) {
          console.log(`    • ${i} requirements created...`);
        }
      }

      // Generate test cases
      const testTypes = ['Functional', 'Integration', 'E2E', 'Regression', 'Performance'];
      const testStatuses = ['Draft', 'Ready', 'In Progress', 'Passed', 'Failed'];

      console.log(`  → Generating ${projectData.testCount} test cases...`);

      for (let i = 1; i <= projectData.testCount; i++) {
        const module = modules[Math.floor(Math.random() * modules.length)];
        const testType = testTypes[Math.floor(Math.random() * testTypes.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const status = testStatuses[Math.floor(Math.random() * testStatuses.length)];

        const steps = [
          { step: 1, action: `Navigate to ${module} page`, expected: 'Page loads successfully' },
          { step: 2, action: 'Perform main action', expected: 'Action completes without errors' },
          { step: 3, action: 'Verify results', expected: 'Expected results are displayed' },
          { step: 4, action: 'Check edge cases', expected: 'Edge cases are handled properly' }
        ];

        await pool.query(`
          INSERT INTO test_cases (
            project_id, key, title, description, priority, type, status, steps, created_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          projectId,
          `${projectData.key}-TC-${i}`,
          `Verify ${module} - Test Case ${i}`,
          `Test ${module.toLowerCase()} functionality to ensure it meets requirements and handles edge cases properly.`,
          priority,
          testType,
          status,
          JSON.stringify(steps),
          userId
        ]);

        if (i % 40 === 0) {
          console.log(`    • ${i} test cases created...`);
        }
      }

      console.log(`✅ Completed: ${projectData.reqCount} requirements, ${projectData.testCount} test cases`);
    }

    console.log('\n🎉 All projects seeded successfully!\n');
    console.log('Project Summary:');
    console.log('  • LAND (Small): 5 requirements, 10 test cases');
    console.log('  • SUPPORT (Medium): 25 requirements, 50 test cases');
    console.log('  • ERP (Large): 100 requirements, 200 test cases');
    console.log(`\n📊 View at: https://orizon-qa.vercel.app/dashboard`);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

seedLargeProjects();
