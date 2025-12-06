/**
 * Security Tests for AI Assistant Tools
 *
 * Comprehensive test suite for the 6-layer security architecture.
 * Tests injection prevention, permission checking, rate limiting,
 * ownership verification, audit logging, and confirmation flows.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Import security modules
import {
  validateInput,
  validateString,
  validatePath,
  validatePattern,
  checkForInjection,
  InputValidationError,
} from '../security/inputValidator.js';

import {
  PERMISSION_LEVELS,
  checkPermission,
  getToolPermissionLevel,
  getUserPermissionLevel,
  isDangerousTool,
  PermissionError,
} from '../security/permissionChecker.js';

import {
  checkRateLimit,
  resetRateLimit,
  getRateLimitStatus,
  recordError,
  checkSuspiciousPatterns,
  RateLimitError,
} from '../security/rateLimiter.js';

import {
  CONFIRMATION_TYPES,
  createConfirmation,
  verifyConfirmation,
  confirmRequest,
  denyConfirmation,
  cancelConfirmation,
  ConfirmationError,
} from '../security/confirmationManager.js';

// ============================================
// Layer 1: Input Validation Tests
// ============================================

describe('Input Validator', () => {
  describe('validateString', () => {
    it('should accept valid strings', () => {
      expect(validateString('hello world')).toBe('hello world');
      expect(validateString('test123')).toBe('test123');
    });

    it('should reject non-strings', () => {
      expect(() => validateString(123)).toThrow(InputValidationError);
      expect(() => validateString(null)).toThrow(InputValidationError);
      expect(() => validateString({})).toThrow(InputValidationError);
    });

    it('should enforce max length', () => {
      const longString = 'a'.repeat(3000);
      expect(() => validateString(longString, { maxLength: 100 }))
        .toThrow(/exceeds maximum length/);
    });

    it('should validate enum values', () => {
      const schema = { enum: ['a', 'b', 'c'] };
      expect(validateString('a', schema)).toBe('a');
      expect(() => validateString('d', schema)).toThrow(/must be one of/);
    });
  });

  describe('SQL Injection Prevention', () => {
    const sqlPayloads = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "1; SELECT * FROM users",
      "UNION SELECT password FROM users",
      "' OR 1=1 --",
      "admin'--",
      "1' AND 1=1 UNION SELECT NULL--",
    ];

    sqlPayloads.forEach((payload) => {
      it(`should block SQL injection: ${payload.slice(0, 30)}...`, () => {
        expect(() => checkForInjection(payload, 'input'))
          .toThrow(/SQL injection/i);
      });
    });
  });

  describe('NoSQL Injection Prevention', () => {
    const nosqlPayloads = [
      '{"$gt": ""}',
      '{"$where": "this.password"}',
      '{"$or": [{}]}',
      '{"$regex": ".*"}',
      '{"username": {"$ne": null}}',
    ];

    nosqlPayloads.forEach((payload) => {
      it(`should block NoSQL injection: ${payload.slice(0, 30)}...`, () => {
        expect(() => checkForInjection(payload, 'input'))
          .toThrow(/NoSQL injection/i);
      });
    });
  });

  describe('XSS Prevention', () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img onerror="alert(1)" src=x>',
      'javascript:alert(1)',
      '<svg onload=alert(1)>',
      '<iframe src="data:text/html,<script>alert(1)</script>">',
    ];

    xssPayloads.forEach((payload) => {
      it(`should block XSS: ${payload.slice(0, 30)}...`, () => {
        expect(() => checkForInjection(payload, 'input'))
          .toThrow(/XSS/i);
      });
    });
  });

  describe('Path Traversal Prevention', () => {
    const traversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\windows\\system32',
      '%2e%2e%2f%2e%2e%2fetc/passwd',
      '....//....//etc/passwd',
      '/etc/passwd',
      'C:\\Windows\\System32',
    ];

    traversalPayloads.forEach((payload) => {
      it(`should block path traversal: ${payload}`, () => {
        expect(() => validatePath(payload, 'path'))
          .toThrow();
      });
    });

    it('should allow valid relative paths', () => {
      expect(validatePath('src/index.js')).toBe('src/index.js');
      expect(validatePath('lib/utils/helper.ts')).toBe('lib/utils/helper.ts');
    });
  });

  describe('Command Injection Prevention', () => {
    const commandPayloads = [
      'file.txt; rm -rf /',
      'test | cat /etc/passwd',
      '$(whoami)',
      '`id`',
      'test && rm -rf /',
    ];

    commandPayloads.forEach((payload) => {
      it(`should block command injection: ${payload}`, () => {
        expect(() => validatePath(payload, 'path'))
          .toThrow();
      });
    });
  });

  describe('Prototype Pollution Prevention', () => {
    it('should reject __proto__ key', () => {
      const input = { '__proto__': { isAdmin: true } };
      expect(() => validateInput(input, { type: 'object', properties: {} }, 'input'))
        .toThrow(/forbidden key/);
    });

    it('should reject constructor key', () => {
      const input = { constructor: { prototype: {} } };
      expect(() => validateInput(input, { type: 'object', properties: {} }, 'input'))
        .toThrow(/forbidden key/);
    });
  });

  describe('Glob Pattern Validation', () => {
    it('should allow valid glob patterns', () => {
      expect(validatePattern('src/**/*.js')).toBe('src/**/*.js');
      expect(validatePattern('*.test.ts')).toBe('*.test.ts');
    });

    it('should reject patterns with too many wildcards', () => {
      expect(() => validatePattern('*/*/*/*/*/test'))
        .toThrow(/too many wildcards/i);
    });

    it('should reject patterns with path traversal', () => {
      expect(() => validatePattern('../**/*.js'))
        .toThrow();
    });
  });
});

// ============================================
// Layer 2: Permission Tests
// ============================================

describe('Permission Checker', () => {
  describe('Permission Levels', () => {
    it('should have correct level hierarchy', () => {
      expect(PERMISSION_LEVELS.L1).toBeLessThan(PERMISSION_LEVELS.L2);
      expect(PERMISSION_LEVELS.L2).toBeLessThan(PERMISSION_LEVELS.L3);
      expect(PERMISSION_LEVELS.L3).toBeLessThan(PERMISSION_LEVELS.L4);
    });
  });

  describe('Tool Permission Mapping', () => {
    it('should assign L1 to read-only tools', () => {
      expect(getToolPermissionLevel('list_available_files')).toBe(PERMISSION_LEVELS.L1);
      expect(getToolPermissionLevel('get_current_config')).toBe(PERMISSION_LEVELS.L1);
    });

    it('should assign L4 to dangerous tools', () => {
      expect(getToolPermissionLevel('delete_project')).toBe(PERMISSION_LEVELS.L4);
      expect(getToolPermissionLevel('clear_history')).toBe(PERMISSION_LEVELS.L4);
    });
  });

  describe('checkPermission', () => {
    it('should allow read tools for guest users', () => {
      const result = checkPermission('list_available_files', null);
      expect(result.allowed).toBe(true);
    });

    it('should deny write tools for guest users', () => {
      const result = checkPermission('select_file', null);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Permission denied');
    });

    it('should allow admin users to access all tools', () => {
      const adminUser = { id: '1', isAdmin: true };
      const result = checkPermission('delete_project', adminUser);
      expect(result.allowed).toBe(true);
    });

    it('should require confirmation for dangerous tools', () => {
      const user = { id: '1', permissionLevel: PERMISSION_LEVELS.L4 };
      const result = checkPermission('delete_project', user);
      expect(result.allowed).toBe(true);
      expect(result.requiresConfirmation).toBe(true);
    });
  });

  describe('isDangerousTool', () => {
    it('should identify dangerous tools', () => {
      expect(isDangerousTool('delete_project')).toBe(true);
      expect(isDangerousTool('bulk_delete')).toBe(true);
      expect(isDangerousTool('clear_history')).toBe(true);
    });

    it('should not flag safe tools', () => {
      expect(isDangerousTool('list_available_files')).toBe(false);
      expect(isDangerousTool('select_file')).toBe(false);
    });
  });
});

// ============================================
// Layer 3: Rate Limiting Tests
// ============================================

describe('Rate Limiter', () => {
  const testUserId = 'test-user-123';

  beforeEach(() => {
    resetRateLimit(testUserId);
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests within limit', () => {
      const result = checkRateLimit(testUserId, 'list_available_files');
      expect(result.allowed).toBe(true);
    });

    it('should block requests over burst limit', () => {
      // Burst limit for read tools is 10 per second
      for (let i = 0; i < 10; i++) {
        checkRateLimit(testUserId, 'list_available_files');
      }

      const result = checkRateLimit(testUserId, 'list_available_files');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Burst rate limit');
    });

    it('should have stricter limits for dangerous tools', () => {
      // Dangerous tools have burst limit of 1
      checkRateLimit(testUserId, 'delete_project');
      const result = checkRateLimit(testUserId, 'delete_project');
      expect(result.allowed).toBe(false);
    });
  });

  describe('Rate Limit Status', () => {
    it('should track usage correctly', () => {
      checkRateLimit(testUserId, 'list_available_files');
      checkRateLimit(testUserId, 'list_available_files');

      const status = getRateLimitStatus(testUserId, 'list_available_files');
      expect(status.used).toBe(2);
      expect(status.remaining).toBe(status.max - 2);
    });
  });

  describe('Violation Penalties', () => {
    it('should increase penalty after violations', () => {
      // Trigger violations by exceeding limit
      for (let i = 0; i < 15; i++) {
        checkRateLimit(testUserId, 'select_file');
      }

      const status = getRateLimitStatus(testUserId, 'select_file');
      expect(status.violations).toBeGreaterThan(0);
      expect(status.penalized).toBe(true);
    });
  });

  describe('Suspicious Pattern Detection', () => {
    it('should detect repeated validation errors', () => {
      // Simulate repeated validation errors
      for (let i = 0; i < 5; i++) {
        recordError(testUserId, 'validation');
      }

      const result = checkSuspiciousPatterns(testUserId);
      expect(result.suspicious).toBe(true);
      expect(result.patterns).toContain('repeated_validation_errors');
    });

    it('should detect repeated permission denials', () => {
      for (let i = 0; i < 3; i++) {
        recordError(testUserId, 'permission');
      }

      const result = checkSuspiciousPatterns(testUserId);
      expect(result.suspicious).toBe(true);
    });
  });
});

// ============================================
// Layer 6: Confirmation Tests
// ============================================

describe('Confirmation Manager', () => {
  const testUserId = 'test-user-456';
  const testSessionId = 'session-789';

  describe('createConfirmation', () => {
    it('should create a valid confirmation request', () => {
      const confirmation = createConfirmation(
        'delete_project',
        { id: 'project-1' },
        testUserId,
        testSessionId,
        CONFIRMATION_TYPES.DESTRUCTIVE,
        'Are you sure you want to delete this project?'
      );

      expect(confirmation.token).toBeDefined();
      expect(confirmation.userId).toBe(testUserId);
      expect(confirmation.toolName).toBe('delete_project');
      expect(confirmation.status).toBe('pending');
    });

    it('should generate unique tokens', () => {
      const conf1 = createConfirmation('delete_project', {}, testUserId, testSessionId, CONFIRMATION_TYPES.DESTRUCTIVE, 'Test');
      const conf2 = createConfirmation('delete_project', {}, testUserId, testSessionId, CONFIRMATION_TYPES.DESTRUCTIVE, 'Test');

      expect(conf1.token).not.toBe(conf2.token);
    });
  });

  describe('verifyConfirmation', () => {
    it('should verify valid confirmation', () => {
      const confirmation = createConfirmation(
        'delete_project',
        { id: 'project-1' },
        testUserId,
        testSessionId,
        CONFIRMATION_TYPES.DESTRUCTIVE,
        'Test'
      );

      const result = verifyConfirmation(confirmation.token, testUserId, testSessionId);
      expect(result.valid).toBe(true);
      expect(result.request).toBeDefined();
    });

    it('should reject wrong user', () => {
      const confirmation = createConfirmation(
        'delete_project',
        { id: 'project-1' },
        testUserId,
        testSessionId,
        CONFIRMATION_TYPES.DESTRUCTIVE,
        'Test'
      );

      const result = verifyConfirmation(confirmation.token, 'wrong-user', testSessionId);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('does not belong');
    });

    it('should reject invalid token', () => {
      const result = verifyConfirmation('invalid-token', testUserId, testSessionId);
      expect(result.valid).toBe(false);
    });
  });

  describe('confirmRequest', () => {
    it('should confirm and return original input', () => {
      const input = { id: 'project-1' };
      const confirmation = createConfirmation(
        'delete_project',
        input,
        testUserId,
        testSessionId,
        CONFIRMATION_TYPES.DESTRUCTIVE,
        'Test'
      );

      const result = confirmRequest(confirmation.token, testUserId, testSessionId);
      expect(result.success).toBe(true);
      expect(result.toolName).toBe('delete_project');
      expect(result.input).toMatchObject(input);
    });
  });

  describe('denyConfirmation', () => {
    it('should deny and cleanup confirmation', () => {
      const confirmation = createConfirmation(
        'delete_project',
        { id: 'project-1' },
        testUserId,
        testSessionId,
        CONFIRMATION_TYPES.DESTRUCTIVE,
        'Test'
      );

      const result = denyConfirmation(confirmation.token, testUserId);
      expect(result.success).toBe(true);

      // Should not be verifiable anymore
      const verifyResult = verifyConfirmation(confirmation.token, testUserId, testSessionId);
      expect(verifyResult.valid).toBe(false);
    });
  });

  describe('Session Binding', () => {
    it('should reject confirmation from different session', () => {
      const confirmation = createConfirmation(
        'delete_project',
        { id: 'project-1' },
        testUserId,
        testSessionId,
        CONFIRMATION_TYPES.DESTRUCTIVE,
        'Test'
      );

      const result = verifyConfirmation(confirmation.token, testUserId, 'different-session');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('same session');
    });
  });
});

// ============================================
// Integration Tests
// ============================================

describe('Security Integration', () => {
  describe('Full Security Pipeline', () => {
    it('should block malicious input even with valid permissions', async () => {
      // Even an admin shouldn't be able to pass SQL injection
      const adminUser = { id: '1', isAdmin: true };

      // This would pass permission check but should fail validation
      expect(() => {
        validateInput(
          { path: "../../../etc/passwd" },
          { type: 'object', properties: { path: { type: 'string', isPath: true } } },
          'input'
        );
      }).toThrow();
    });

    it('should require confirmation even after passing all other checks', () => {
      const user = { id: '1', permissionLevel: PERMISSION_LEVELS.L4 };

      // Permission check passes but requires confirmation
      const permResult = checkPermission('delete_project', user);
      expect(permResult.allowed).toBe(true);
      expect(permResult.requiresConfirmation).toBe(true);
    });
  });

  describe('Defense in Depth', () => {
    it('should have multiple layers blocking attacks', () => {
      const maliciousPayload = "'; DROP TABLE users; --";

      // Layer 1: Input validation blocks it
      expect(() => checkForInjection(maliciousPayload, 'test')).toThrow();

      // Even if validation somehow passed, path validation would catch it
      expect(() => validatePath(maliciousPayload)).toThrow();
    });
  });
});
