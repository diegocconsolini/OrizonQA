import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL
});

async function seedProjects() {
  try {
    // Get user ID for diegocavalariconsolini@gmail.com
    const userResult = await pool.query(
      'SELECT id, full_name FROM users WHERE email = $1',
      ['diegocavalariconsolini@gmail.com']
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User not found: diegocavalariconsolini@gmail.com');
      console.log('Please sign up first at https://orizon-qa.vercel.app/signup');
      process.exit(1);
    }

    const userId = userResult.rows[0].id;
    const userName = userResult.rows[0].full_name;
    console.log(`✓ Found user: ${userName} (ID: ${userId})`);

    // Template projects
    const projects = [
      {
        name: 'E-Commerce Platform',
        key: 'ECOM',
        description: 'Full-stack e-commerce application with payment integration, inventory management, and order tracking',
        settings: {
          testFramework: 'Jest',
          cicdEnabled: true,
          jiraIntegration: false
        }
      },
      {
        name: 'Mobile Banking App',
        key: 'BANK',
        description: 'Secure mobile banking application with biometric authentication, transaction history, and bill payments',
        settings: {
          testFramework: 'Pytest',
          cicdEnabled: true,
          jiraIntegration: false
        }
      },
      {
        name: 'Healthcare Portal',
        key: 'HEALTH',
        description: 'Patient portal for managing appointments, medical records, prescriptions, and telemedicine consultations',
        settings: {
          testFramework: 'JUnit',
          cicdEnabled: false,
          jiraIntegration: false
        }
      },
      {
        name: 'Task Management System',
        key: 'TASK',
        description: 'Collaborative task and project management platform with Kanban boards, time tracking, and team collaboration',
        settings: {
          testFramework: 'Jest',
          cicdEnabled: true,
          jiraIntegration: true
        }
      },
      {
        name: 'Content Management System',
        key: 'CMS',
        description: 'Headless CMS for managing multi-channel content, media assets, and publishing workflows',
        settings: {
          testFramework: 'Mocha',
          cicdEnabled: true,
          jiraIntegration: false
        }
      }
    ];

    // Insert projects
    for (const project of projects) {
      // Check if project key already exists
      const existingProject = await pool.query(
        'SELECT id FROM projects WHERE key = $1',
        [project.key]
      );

      if (existingProject.rows.length > 0) {
        console.log(`⚠ Project "${project.key}" already exists, skipping...`);
        continue;
      }

      // Create project
      const result = await pool.query(`
        INSERT INTO projects (name, key, description, owner_id, settings)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, key
      `, [
        project.name,
        project.key,
        project.description,
        userId,
        JSON.stringify(project.settings)
      ]);

      const projectId = result.rows[0].id;
      console.log(`✓ Created project: ${result.rows[0].name} (${result.rows[0].key})`);

      // Add owner as Admin member
      await pool.query(`
        INSERT INTO project_members (project_id, user_id, role, added_by)
        VALUES ($1, $2, 'Admin', $3)
        ON CONFLICT (project_id, user_id) DO NOTHING
      `, [projectId, userId, userId]);

      // Add sample requirements
      const requirements = [
        {
          key: `${project.key}-1`,
          title: 'User Authentication',
          description: 'Implement secure user login and registration',
          type: 'Story',
          priority: 'High'
        },
        {
          key: `${project.key}-2`,
          title: 'Dashboard Overview',
          description: 'Create main dashboard with key metrics and analytics',
          type: 'Story',
          priority: 'Medium'
        },
        {
          key: `${project.key}-3`,
          title: 'API Performance Optimization',
          description: 'Optimize database queries and API response times',
          type: 'Task',
          priority: 'High'
        }
      ];

      for (const req of requirements) {
        await pool.query(`
          INSERT INTO requirements (project_id, key, title, description, type, priority, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [projectId, req.key, req.title, req.description, req.type, req.priority, userId]);
      }

      // Add sample test cases
      const testCases = [
        {
          key: `${project.key}-TC-1`,
          title: 'Login with valid credentials',
          description: 'Verify user can login with correct email and password',
          priority: 'High',
          type: 'Functional',
          steps: [
            { step: 1, action: 'Navigate to login page', expected: 'Login form is displayed' },
            { step: 2, action: 'Enter valid email and password', expected: 'Credentials are accepted' },
            { step: 3, action: 'Click Login button', expected: 'User is redirected to dashboard' }
          ]
        },
        {
          key: `${project.key}-TC-2`,
          title: 'Data validation on form submission',
          description: 'Verify form validates required fields before submission',
          priority: 'Medium',
          type: 'Functional',
          steps: [
            { step: 1, action: 'Open form page', expected: 'Form is displayed' },
            { step: 2, action: 'Submit empty form', expected: 'Validation errors are shown' },
            { step: 3, action: 'Fill required fields', expected: 'Form submits successfully' }
          ]
        }
      ];

      for (const tc of testCases) {
        await pool.query(`
          INSERT INTO test_cases (project_id, key, title, description, priority, type, steps, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [projectId, tc.key, tc.title, tc.description, tc.priority, tc.type, JSON.stringify(tc.steps), userId]);
      }

      console.log(`  → Added 3 requirements and 2 test cases`);
    }

    console.log('\n✅ Project seeding completed successfully!');
    console.log(`\nView your projects at: https://orizon-qa.vercel.app/dashboard`);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding projects:', error);
    await pool.end();
    process.exit(1);
  }
}

seedProjects();
