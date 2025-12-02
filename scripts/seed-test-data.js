/**
 * Seed Test Data Script
 *
 * Creates 20 projects with varied stages and items:
 * - Projects in different phases (planning, active, maintenance, archived)
 * - Requirements of different types and priorities
 * - Test cases with various statuses
 * - Test coverage links
 * - Test runs with results
 */

import { query } from '../lib/db.js';
import { createProject } from '../lib/db-projects.js';
import { createRequirement } from '../lib/db-requirements.js';
import { createTestCase } from '../lib/db-test-cases.js';
import { linkTestToRequirement } from '../lib/db-test-coverage.js';

// Get user ID (get the first user in the database)
async function getUserId() {
  const result = await query('SELECT id, email FROM users ORDER BY id LIMIT 1');
  if (result.rows.length === 0) {
    throw new Error('No users found in database. Please create a user first.');
  }
  console.log(`Using user: ${result.rows[0].email} (ID: ${result.rows[0].id})`);
  return result.rows[0].id;
}

// Project templates with varied characteristics
const projectTemplates = [
  {
    name: 'E-Commerce Platform',
    key: 'ECOM',
    description: 'Online shopping platform with payment integration',
    stage: 'active',
    requirements: 25,
    tests: 40,
    coverage: 85,
  },
  {
    name: 'Mobile Banking App',
    key: 'MBANK',
    description: 'iOS and Android banking application',
    stage: 'active',
    requirements: 30,
    tests: 50,
    coverage: 90,
  },
  {
    name: 'CRM System',
    key: 'CRM',
    description: 'Customer relationship management tool',
    stage: 'maintenance',
    requirements: 20,
    tests: 35,
    coverage: 75,
  },
  {
    name: 'Inventory Management',
    key: 'INV',
    description: 'Warehouse and inventory tracking system',
    stage: 'planning',
    requirements: 15,
    tests: 10,
    coverage: 40,
  },
  {
    name: 'HR Portal',
    key: 'HRP',
    description: 'Employee management and self-service portal',
    stage: 'active',
    requirements: 18,
    tests: 30,
    coverage: 80,
  },
  {
    name: 'Analytics Dashboard',
    key: 'DASH',
    description: 'Business intelligence and reporting dashboard',
    stage: 'active',
    requirements: 22,
    tests: 38,
    coverage: 88,
  },
  {
    name: 'Social Media App',
    key: 'SOCIAL',
    description: 'Social networking platform',
    stage: 'planning',
    requirements: 35,
    tests: 20,
    coverage: 30,
  },
  {
    name: 'Content Management System',
    key: 'CMS',
    description: 'Website content and media management',
    stage: 'maintenance',
    requirements: 16,
    tests: 28,
    coverage: 70,
  },
  {
    name: 'Learning Management System',
    key: 'LMS',
    description: 'Online education and training platform',
    stage: 'active',
    requirements: 28,
    tests: 45,
    coverage: 92,
  },
  {
    name: 'Healthcare Portal',
    key: 'HEALTH',
    description: 'Patient records and appointment scheduling',
    stage: 'active',
    requirements: 32,
    tests: 55,
    coverage: 95,
  },
  {
    name: 'Real Estate Platform',
    key: 'PROP',
    description: 'Property listings and virtual tours',
    stage: 'planning',
    requirements: 12,
    tests: 8,
    coverage: 35,
  },
  {
    name: 'Food Delivery App',
    key: 'FOOD',
    description: 'Restaurant ordering and delivery tracking',
    stage: 'active',
    requirements: 26,
    tests: 42,
    coverage: 85,
  },
  {
    name: 'Project Management Tool',
    key: 'PM',
    description: 'Task tracking and team collaboration',
    stage: 'maintenance',
    requirements: 24,
    tests: 40,
    coverage: 78,
  },
  {
    name: 'Video Streaming Service',
    key: 'STREAM',
    description: 'On-demand video content platform',
    stage: 'active',
    requirements: 30,
    tests: 48,
    coverage: 87,
  },
  {
    name: 'Fitness Tracking App',
    key: 'FIT',
    description: 'Workout logging and health metrics',
    stage: 'planning',
    requirements: 14,
    tests: 12,
    coverage: 45,
  },
  {
    name: 'Travel Booking System',
    key: 'TRAVEL',
    description: 'Flight and hotel reservation platform',
    stage: 'active',
    requirements: 28,
    tests: 46,
    coverage: 90,
  },
  {
    name: 'Email Marketing Platform',
    key: 'EMAIL',
    description: 'Campaign management and analytics',
    stage: 'maintenance',
    requirements: 18,
    tests: 32,
    coverage: 72,
  },
  {
    name: 'IoT Device Manager',
    key: 'IOT',
    description: 'Smart home device control and monitoring',
    stage: 'planning',
    requirements: 20,
    tests: 15,
    coverage: 50,
  },
  {
    name: 'Cryptocurrency Exchange',
    key: 'CRYPTO',
    description: 'Digital asset trading platform',
    stage: 'active',
    requirements: 35,
    tests: 60,
    coverage: 93,
  },
  {
    name: 'Document Collaboration',
    key: 'DOCS',
    description: 'Real-time document editing and sharing',
    stage: 'active',
    requirements: 22,
    tests: 38,
    coverage: 86,
  },
];

// Requirement types and priorities
const reqTypes = ['Story', 'Bug', 'Task', 'Epic'];
const priorities = ['Critical', 'High', 'Medium', 'Low'];
const statuses = ['Open', 'In Progress', 'In Review', 'Closed'];

// Test case types and statuses
const testTypes = ['Functional', 'Integration', 'Regression', 'Performance', 'Security'];
const testStatuses = ['Draft', 'Ready', 'Active', 'Deprecated'];
const testPriorities = ['Critical', 'High', 'Medium', 'Low'];

// Generate random item from array
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Generate requirement title based on type
function generateRequirementTitle(type, index) {
  const titles = {
    Story: [
      'User Registration Flow',
      'Payment Processing',
      'Search Functionality',
      'User Profile Management',
      'Notification System',
      'Dashboard Analytics',
      'File Upload Feature',
      'Multi-language Support',
      'Social Media Integration',
      'Two-Factor Authentication',
    ],
    Bug: [
      'Login Page Timeout',
      'Memory Leak in Dashboard',
      'Incorrect Date Format',
      'Broken Image Links',
      'Session Expiration Issue',
    ],
    Task: [
      'Database Migration',
      'API Documentation',
      'Performance Optimization',
      'Security Audit',
      'Code Refactoring',
    ],
    Epic: [
      'Mobile App Launch',
      'Payment Gateway Integration',
      'Advanced Reporting',
      'Multi-tenant Architecture',
    ],
  };

  const typeList = titles[type] || titles['Story'];
  return typeList[index % typeList.length];
}

// Generate test case title
function generateTestTitle(type, index) {
  const titles = {
    Functional: [
      'Verify User Login',
      'Test Form Validation',
      'Check Data Submission',
      'Validate API Response',
      'Test Error Handling',
    ],
    Integration: [
      'API Integration Test',
      'Database Connection Test',
      'Third-party Service Integration',
      'End-to-end Workflow',
    ],
    Regression: [
      'Regression Suite - User Module',
      'Regression Suite - Payment',
      'Regression Suite - Reports',
    ],
    Performance: [
      'Load Test - 1000 Users',
      'Response Time Test',
      'Database Query Performance',
    ],
    Security: [
      'SQL Injection Test',
      'XSS Vulnerability Test',
      'Authentication Test',
    ],
  };

  const typeList = titles[type] || titles['Functional'];
  return typeList[index % typeList.length];
}

// Create requirements for a project
async function createRequirements(projectId, userId, count) {
  const requirements = [];

  for (let i = 0; i < count; i++) {
    const type = randomItem(reqTypes);
    const requirement = await createRequirement({
      project_id: projectId,
      key: `REQ-${i + 1}`,
      title: generateRequirementTitle(type, i),
      description: `Detailed description for requirement ${i + 1}`,
      type,
      status: randomItem(statuses),
      priority: randomItem(priorities),
      version: `1.${Math.floor(i / 5)}`,
      created_by: userId,
    });

    requirements.push(requirement);
  }

  return requirements;
}

// Create test cases for a project
async function createTestCases(projectId, userId, count) {
  const tests = [];

  for (let i = 0; i < count; i++) {
    const type = randomItem(testTypes);
    const test = await createTestCase(projectId, userId, {
      key: `TC-${i + 1}`,
      title: generateTestTitle(type, i),
      description: `Test steps for test case ${i + 1}`,
      type,
      status: randomItem(testStatuses),
      priority: randomItem(testPriorities),
      preconditions: 'User is logged in',
      steps: '1. Navigate to page\n2. Enter data\n3. Submit form\n4. Verify result',
      expected_result: 'Operation completes successfully',
      estimated_time: Math.floor(Math.random() * 30) + 5,
    });

    tests.push(test);
  }

  return tests;
}

// Link tests to requirements based on coverage percentage
async function createCoverageLinks(requirements, tests, coveragePercent) {
  const targetCoveredReqs = Math.floor(requirements.length * (coveragePercent / 100));

  // Shuffle requirements and take target number
  const shuffled = [...requirements].sort(() => Math.random() - 0.5);
  const reqsToLink = shuffled.slice(0, targetCoveredReqs);

  let linksCreated = 0;

  for (const req of reqsToLink) {
    // Link 1-3 tests to each requirement
    const numTests = Math.floor(Math.random() * 3) + 1;
    const testsToLink = [...tests].sort(() => Math.random() - 0.5).slice(0, numTests);

    for (const test of testsToLink) {
      try {
        await linkTestToRequirement(req.id, test.id, 'Covers');
        linksCreated++;
      } catch (err) {
        // Ignore duplicate link errors
      }
    }
  }

  return linksCreated;
}

// Main seeding function
async function seedTestData() {
  try {
    console.log('<1 Starting test data seeding...\n');

    const userId = await getUserId();
    console.log(` Found user ID: ${userId}\n`);

    let totalProjects = 0;
    let totalRequirements = 0;
    let totalTests = 0;
    let totalLinks = 0;

    for (const template of projectTemplates) {
      console.log(`=� Creating project: ${template.name} (${template.key})`);

      // Create project
      const project = await createProject(userId, {
        key: template.key,
        name: template.name,
        description: template.description,
      });
      totalProjects++;

      console.log(`   Project created (ID: ${project.id})`);

      // Create requirements
      console.log(`  =� Creating ${template.requirements} requirements...`);
      const requirements = await createRequirements(project.id, userId, template.requirements);
      totalRequirements += requirements.length;
      console.log(`   ${requirements.length} requirements created`);

      // Create test cases
      console.log(`  >� Creating ${template.tests} test cases...`);
      const tests = await createTestCases(project.id, userId, template.tests);
      totalTests += tests.length;
      console.log(`   ${tests.length} test cases created`);

      // Create coverage links
      console.log(`  = Creating coverage links (${template.coverage}% target)...`);
      const links = await createCoverageLinks(requirements, tests, template.coverage);
      totalLinks += links;
      console.log(`   ${links} coverage links created`);

      console.log(`   ${template.name} completed\n`);
    }

    console.log('PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP');
    console.log('<� Test data seeding completed successfully!\n');
    console.log(`=� Summary:`);
    console.log(`  " Projects:     ${totalProjects}`);
    console.log(`  " Requirements: ${totalRequirements}`);
    console.log(`  " Test Cases:   ${totalTests}`);
    console.log(`  " Coverage Links: ${totalLinks}`);
    console.log('PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP\n');

    process.exit(0);
  } catch (error) {
    console.error('L Error seeding test data:', error);
    process.exit(1);
  }
}

// Run seeding
seedTestData();
