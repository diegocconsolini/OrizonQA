/**
 * Tool Input Validator
 *
 * Security-focused validation for all tool inputs.
 * Prevents path traversal, injection, and other attacks.
 */

import { TOOL_NAMES, getToolByName } from './definitions.js';

// ============================================
// Validation Constants
// ============================================

const MAX_STRING_LENGTH = 2000;
const MAX_PATH_LENGTH = 500;
const MAX_PATTERN_LENGTH = 100;
const MAX_FILES = 100;
const MAX_LINES = 500;
const MAX_RESULT_LENGTH = 10000;

// Safe characters for file paths
const SAFE_PATH_REGEX = /^[a-zA-Z0-9._\/-]+$/;

// Safe characters for glob patterns
const SAFE_GLOB_REGEX = /^[a-zA-Z0-9.*_\/-]+$/;

// Dangerous patterns to block
const DANGEROUS_PATTERNS = [
  '..', // Path traversal
  '\\', // Windows path (shouldn't be used)
  '${', // Template injection
  '`', // Command injection
  ';', // Command chaining
  '|', // Pipe
  '>', // Redirect
  '<', // Redirect
  '&', // Background/AND
];

// ============================================
// Validation Functions
// ============================================

/**
 * Validate a tool call
 * @throws Error if validation fails
 */
export function validateToolCall(toolName, input) {
  // Check tool exists
  if (!TOOL_NAMES.has(toolName)) {
    throw new ValidationError(`Unknown tool: ${toolName}`);
  }

  // Get tool schema
  const tool = getToolByName(toolName);
  if (!tool) {
    throw new ValidationError(`Tool not found: ${toolName}`);
  }

  // Validate input against schema
  validateSchema(input, tool.input_schema, toolName);

  // Tool-specific validation
  switch (toolName) {
    case 'select_file':
    case 'get_file_content':
      validateFilePath(input.path);
      break;

    case 'select_files_by_pattern':
      validateGlobPattern(input.pattern);
      if (input.maxFiles !== undefined) {
        validateMaxFiles(input.maxFiles);
      }
      break;

    case 'select_all_code_files':
      if (input.maxFiles !== undefined) {
        validateMaxFiles(input.maxFiles);
      }
      break;

    case 'list_available_files':
      if (input.directory) {
        validateFilePath(input.directory);
      }
      if (input.filter) {
        validateExtensionFilter(input.filter);
      }
      break;

    case 'set_additional_context':
      validateContextString(input.context);
      break;

    case 'start_analysis':
      if (input.confirm !== true) {
        throw new ValidationError('Analysis requires confirm=true');
      }
      break;

    case 'get_file_content':
      if (input.maxLines !== undefined) {
        validateMaxLines(input.maxLines);
      }
      break;

    case 'get_analysis_results':
      if (input.maxLength !== undefined) {
        validateMaxResultLength(input.maxLength);
      }
      break;

    case 'suggest_navigation':
      if (input.reason) {
        validateShortString(input.reason, 200, 'reason');
      }
      break;
  }

  return true;
}

/**
 * Validate input against JSON schema
 */
function validateSchema(input, schema, toolName) {
  if (!input || typeof input !== 'object') {
    input = {};
  }

  // Check required fields
  const required = schema.required || [];
  for (const field of required) {
    if (input[field] === undefined || input[field] === null) {
      throw new ValidationError(`Missing required field: ${field}`);
    }
  }

  // Validate each property
  const properties = schema.properties || {};
  for (const [key, value] of Object.entries(input)) {
    const propSchema = properties[key];
    if (!propSchema) {
      // Unknown property - ignore but log
      console.warn(`Unknown property '${key}' for tool '${toolName}'`);
      continue;
    }

    // Type validation
    validateType(value, propSchema, key);
  }
}

/**
 * Validate value against property schema
 */
function validateType(value, schema, fieldName) {
  const expectedType = schema.type;

  switch (expectedType) {
    case 'string':
      if (typeof value !== 'string') {
        throw new ValidationError(`${fieldName} must be a string`);
      }
      // Check enum if present
      if (schema.enum && !schema.enum.includes(value)) {
        throw new ValidationError(
          `${fieldName} must be one of: ${schema.enum.join(', ')}`
        );
      }
      // Check max length
      if (value.length > MAX_STRING_LENGTH) {
        throw new ValidationError(
          `${fieldName} exceeds maximum length of ${MAX_STRING_LENGTH}`
        );
      }
      break;

    case 'integer':
    case 'number':
      if (typeof value !== 'number' || (expectedType === 'integer' && !Number.isInteger(value))) {
        throw new ValidationError(`${fieldName} must be ${expectedType === 'integer' ? 'an integer' : 'a number'}`);
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        throw new ValidationError(`${fieldName} must be a boolean`);
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        throw new ValidationError(`${fieldName} must be an array`);
      }
      break;

    case 'object':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new ValidationError(`${fieldName} must be an object`);
      }
      break;
  }
}

/**
 * Validate file path for security
 */
export function validateFilePath(path) {
  if (!path || typeof path !== 'string') {
    throw new ValidationError('Path must be a non-empty string');
  }

  if (path.length > MAX_PATH_LENGTH) {
    throw new ValidationError(`Path exceeds maximum length of ${MAX_PATH_LENGTH}`);
  }

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (path.includes(pattern)) {
      throw new ValidationError(`Path contains forbidden pattern: ${pattern}`);
    }
  }

  // Must not start with /
  if (path.startsWith('/')) {
    throw new ValidationError('Absolute paths are not allowed');
  }

  // Check for safe characters
  if (!SAFE_PATH_REGEX.test(path)) {
    throw new ValidationError('Path contains invalid characters');
  }

  return true;
}

/**
 * Validate glob pattern for security
 */
export function validateGlobPattern(pattern) {
  if (!pattern || typeof pattern !== 'string') {
    throw new ValidationError('Pattern must be a non-empty string');
  }

  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new ValidationError(`Pattern exceeds maximum length of ${MAX_PATTERN_LENGTH}`);
  }

  // Check for dangerous patterns
  for (const dangerous of DANGEROUS_PATTERNS) {
    if (pattern.includes(dangerous)) {
      throw new ValidationError(`Pattern contains forbidden: ${dangerous}`);
    }
  }

  // Check for safe glob characters
  if (!SAFE_GLOB_REGEX.test(pattern)) {
    throw new ValidationError('Pattern contains invalid characters');
  }

  // Limit number of wildcards to prevent ReDoS-like issues
  const wildcardCount = (pattern.match(/\*/g) || []).length;
  if (wildcardCount > 4) {
    throw new ValidationError('Too many wildcards in pattern (max 4)');
  }

  return true;
}

/**
 * Validate extension filter
 */
export function validateExtensionFilter(filter) {
  if (!filter || typeof filter !== 'string') {
    throw new ValidationError('Filter must be a non-empty string');
  }

  if (filter.length > 20) {
    throw new ValidationError('Filter too long');
  }

  // Must start with a dot
  if (!filter.startsWith('.')) {
    throw new ValidationError('Extension filter must start with "."');
  }

  // Only alphanumeric after the dot
  if (!/^\.[a-z0-9]+$/i.test(filter)) {
    throw new ValidationError('Invalid extension filter format');
  }

  return true;
}

/**
 * Validate maxFiles parameter
 */
export function validateMaxFiles(maxFiles) {
  if (typeof maxFiles !== 'number' || !Number.isInteger(maxFiles)) {
    throw new ValidationError('maxFiles must be an integer');
  }

  if (maxFiles < 1) {
    throw new ValidationError('maxFiles must be at least 1');
  }

  if (maxFiles > MAX_FILES) {
    throw new ValidationError(`maxFiles cannot exceed ${MAX_FILES}`);
  }

  return true;
}

/**
 * Validate maxLines parameter
 */
export function validateMaxLines(maxLines) {
  if (typeof maxLines !== 'number' || !Number.isInteger(maxLines)) {
    throw new ValidationError('maxLines must be an integer');
  }

  if (maxLines < 1) {
    throw new ValidationError('maxLines must be at least 1');
  }

  if (maxLines > MAX_LINES) {
    throw new ValidationError(`maxLines cannot exceed ${MAX_LINES}`);
  }

  return true;
}

/**
 * Validate maxLength for results
 */
export function validateMaxResultLength(maxLength) {
  if (typeof maxLength !== 'number' || !Number.isInteger(maxLength)) {
    throw new ValidationError('maxLength must be an integer');
  }

  if (maxLength < 100) {
    throw new ValidationError('maxLength must be at least 100');
  }

  if (maxLength > MAX_RESULT_LENGTH) {
    throw new ValidationError(`maxLength cannot exceed ${MAX_RESULT_LENGTH}`);
  }

  return true;
}

/**
 * Validate context string
 */
export function validateContextString(context) {
  if (!context || typeof context !== 'string') {
    throw new ValidationError('Context must be a non-empty string');
  }

  if (context.length > MAX_STRING_LENGTH) {
    throw new ValidationError(`Context exceeds maximum length of ${MAX_STRING_LENGTH}`);
  }

  // Check for template injection attempts
  if (context.includes('${') || context.includes('{{')) {
    throw new ValidationError('Context contains forbidden template syntax');
  }

  return true;
}

/**
 * Validate short string with custom max length
 */
export function validateShortString(value, maxLength, fieldName) {
  if (!value || typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a non-empty string`);
  }

  if (value.length > maxLength) {
    throw new ValidationError(`${fieldName} exceeds maximum length of ${maxLength}`);
  }

  return true;
}

// ============================================
// Custom Error Class
// ============================================

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.isValidationError = true;
  }
}

// ============================================
// Export Default
// ============================================

export default {
  validateToolCall,
  validateFilePath,
  validateGlobPattern,
  validateExtensionFilter,
  validateMaxFiles,
  validateMaxLines,
  validateContextString,
  ValidationError,
};
