/**
 * Input Validator - Layer 1: Input Validation & Sanitization
 *
 * Deep validation and sanitization for all tool inputs.
 * Prevents injection attacks, path traversal, and malicious payloads.
 *
 * Security measures:
 * - SQL injection prevention
 * - NoSQL injection prevention
 * - XSS prevention
 * - Path traversal prevention
 * - Command injection prevention
 * - Prototype pollution prevention
 * - ReDoS prevention
 */

// ============================================
// Constants
// ============================================

const MAX_STRING_LENGTH = 2000;
const MAX_PATH_LENGTH = 500;
const MAX_PATTERN_LENGTH = 100;
const MAX_INTEGER = 10000;
const MAX_ARRAY_LENGTH = 100;
const MAX_OBJECT_DEPTH = 5;

// Characters that are always dangerous
const DANGEROUS_CHARS = [
  '\x00', // Null byte
  '\x0d', // Carriage return
  '\x0a', // Line feed (in certain contexts)
];

// SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|UNION|DECLARE)\b)/i,
  /(-{2}|\/\*|\*\/)/,        // SQL comments
  /(\bOR\b|\bAND\b)\s*\d+\s*=\s*\d+/i, // OR 1=1, AND 1=1
  /(;|\bEXEC\b|\bEXECUTE\b)/i,
  /(\bCHAR\b\s*\(|\bASCII\b\s*\()/i,
];

// NoSQL injection patterns
const NOSQL_INJECTION_PATTERNS = [
  /\$where/i,
  /\$gt|\$lt|\$gte|\$lte|\$ne|\$eq/i,
  /\$regex|\$options/i,
  /\{\s*"\$[a-z]+"/i,
  /\$or|\$and|\$not|\$nor/i,
];

// XSS patterns
const XSS_PATTERNS = [
  /<script[\s>]/i,
  /<\/script>/i,
  /javascript:/i,
  /on\w+\s*=/i, // onclick=, onerror=, etc.
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /<svg[\s>]/i,
  /data:/i,
  /vbscript:/i,
];

// Command injection patterns
const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$()]/,
  /\$\(/,
  /`.*`/,
  /\|\|/,
  /&&/,
  /\n/,
  /\r/,
];

// Path traversal patterns
const PATH_TRAVERSAL_PATTERNS = [
  /\.\./,
  /%2e%2e/i,
  /%252e/i,
  /\.\.%2f/i,
  /%2f\.\./i,
  /\.\.\\/,
  /%5c/i,
];

// Prototype pollution keys
const PROTOTYPE_POLLUTION_KEYS = [
  '__proto__',
  'constructor',
  'prototype',
];

// ============================================
// Main Validation Functions
// ============================================

/**
 * Validate and sanitize any input value
 * @param {any} value - The value to validate
 * @param {object} schema - Validation schema
 * @param {string} fieldName - Name of the field (for error messages)
 * @param {number} depth - Current object depth (for recursion limit)
 * @returns {any} Sanitized value
 * @throws {InputValidationError} If validation fails
 */
export function validateInput(value, schema, fieldName = 'input', depth = 0) {
  // Check recursion depth
  if (depth > MAX_OBJECT_DEPTH) {
    throw new InputValidationError(`Object too deeply nested (max ${MAX_OBJECT_DEPTH} levels)`);
  }

  // Handle null/undefined
  if (value === null || value === undefined) {
    if (schema.required) {
      throw new InputValidationError(`${fieldName} is required`);
    }
    return schema.default ?? null;
  }

  // Type-specific validation
  switch (schema.type) {
    case 'string':
      return validateString(value, schema, fieldName);
    case 'integer':
    case 'number':
      return validateNumber(value, schema, fieldName);
    case 'boolean':
      return validateBoolean(value, fieldName);
    case 'array':
      return validateArray(value, schema, fieldName, depth);
    case 'object':
      return validateObject(value, schema, fieldName, depth);
    default:
      throw new InputValidationError(`Unknown type: ${schema.type}`);
  }
}

/**
 * Validate and sanitize string input
 */
export function validateString(value, schema = {}, fieldName = 'string') {
  // Type check
  if (typeof value !== 'string') {
    throw new InputValidationError(`${fieldName} must be a string`);
  }

  // Length checks
  const maxLength = schema.maxLength || MAX_STRING_LENGTH;
  if (value.length > maxLength) {
    throw new InputValidationError(`${fieldName} exceeds maximum length of ${maxLength}`);
  }

  const minLength = schema.minLength || 0;
  if (value.length < minLength) {
    throw new InputValidationError(`${fieldName} must be at least ${minLength} characters`);
  }

  // Enum validation (whitelist)
  if (schema.enum) {
    if (!schema.enum.includes(value)) {
      throw new InputValidationError(
        `${fieldName} must be one of: ${schema.enum.join(', ')}`
      );
    }
    return value; // Enum values are trusted, return as-is
  }

  // Security checks based on context
  let sanitized = value;

  // Remove null bytes and control characters
  sanitized = removeControlChars(sanitized);

  // Context-specific validation
  if (schema.format === 'path' || schema.isPath) {
    sanitized = validatePath(sanitized, fieldName);
  } else if (schema.format === 'pattern' || schema.isPattern) {
    sanitized = validatePattern(sanitized, fieldName);
  } else if (schema.format === 'html' || schema.allowHtml) {
    // Strict HTML sanitization
    sanitized = sanitizeHtml(sanitized);
  } else {
    // Default: check for injection attacks
    checkForInjection(sanitized, fieldName);
  }

  // Regex validation if provided
  if (schema.pattern) {
    const regex = new RegExp(schema.pattern);
    if (!regex.test(sanitized)) {
      throw new InputValidationError(`${fieldName} has invalid format`);
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize number input
 */
export function validateNumber(value, schema = {}, fieldName = 'number') {
  // Type check
  if (typeof value !== 'number' || isNaN(value)) {
    throw new InputValidationError(`${fieldName} must be a number`);
  }

  // Integer check
  if (schema.type === 'integer' && !Number.isInteger(value)) {
    throw new InputValidationError(`${fieldName} must be an integer`);
  }

  // Range checks
  const min = schema.minimum ?? -MAX_INTEGER;
  const max = schema.maximum ?? MAX_INTEGER;

  if (value < min) {
    throw new InputValidationError(`${fieldName} must be at least ${min}`);
  }

  if (value > max) {
    throw new InputValidationError(`${fieldName} must be at most ${max}`);
  }

  return value;
}

/**
 * Validate boolean input
 */
export function validateBoolean(value, fieldName = 'boolean') {
  if (typeof value !== 'boolean') {
    throw new InputValidationError(`${fieldName} must be a boolean`);
  }
  return value;
}

/**
 * Validate and sanitize array input
 */
export function validateArray(value, schema = {}, fieldName = 'array', depth = 0) {
  if (!Array.isArray(value)) {
    throw new InputValidationError(`${fieldName} must be an array`);
  }

  const maxItems = schema.maxItems || MAX_ARRAY_LENGTH;
  if (value.length > maxItems) {
    throw new InputValidationError(`${fieldName} exceeds maximum of ${maxItems} items`);
  }

  const minItems = schema.minItems || 0;
  if (value.length < minItems) {
    throw new InputValidationError(`${fieldName} must have at least ${minItems} items`);
  }

  // Validate each item if item schema provided
  if (schema.items) {
    return value.map((item, index) =>
      validateInput(item, schema.items, `${fieldName}[${index}]`, depth + 1)
    );
  }

  return value;
}

/**
 * Validate and sanitize object input
 */
export function validateObject(value, schema = {}, fieldName = 'object', depth = 0) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new InputValidationError(`${fieldName} must be an object`);
  }

  // Check for prototype pollution
  for (const key of Object.keys(value)) {
    if (PROTOTYPE_POLLUTION_KEYS.includes(key)) {
      throw new InputValidationError(`${fieldName} contains forbidden key: ${key}`);
    }
  }

  // Validate properties if schema provided
  const result = {};
  const properties = schema.properties || {};
  const required = schema.required || [];

  // Check required fields
  for (const req of required) {
    if (!(req in value)) {
      throw new InputValidationError(`${fieldName}.${req} is required`);
    }
  }

  // Validate each property
  for (const [key, propValue] of Object.entries(value)) {
    const propSchema = properties[key];
    if (propSchema) {
      result[key] = validateInput(propValue, propSchema, `${fieldName}.${key}`, depth + 1);
    } else if (schema.additionalProperties === false) {
      // Ignore unknown properties if additionalProperties is false
      console.warn(`Ignoring unknown property: ${fieldName}.${key}`);
    } else {
      // Pass through with basic sanitization
      result[key] = sanitizeUnknown(propValue, depth);
    }
  }

  return result;
}

// ============================================
// Path Validation
// ============================================

/**
 * Validate file path for security
 */
export function validatePath(path, fieldName = 'path') {
  if (!path || typeof path !== 'string') {
    throw new InputValidationError(`${fieldName} must be a non-empty string`);
  }

  if (path.length > MAX_PATH_LENGTH) {
    throw new InputValidationError(`${fieldName} exceeds maximum length of ${MAX_PATH_LENGTH}`);
  }

  // Check for path traversal
  for (const pattern of PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(path)) {
      throw new InputValidationError(`${fieldName} contains path traversal attempt`);
    }
  }

  // Must not be absolute
  if (path.startsWith('/') || /^[A-Z]:\\/i.test(path)) {
    throw new InputValidationError(`${fieldName}: absolute paths are not allowed`);
  }

  // Check for command injection
  for (const pattern of COMMAND_INJECTION_PATTERNS) {
    if (pattern.test(path)) {
      throw new InputValidationError(`${fieldName} contains forbidden characters`);
    }
  }

  // Only allow safe characters
  const safePathRegex = /^[a-zA-Z0-9._\/-]+$/;
  if (!safePathRegex.test(path)) {
    throw new InputValidationError(`${fieldName} contains invalid characters`);
  }

  return path;
}

/**
 * Validate glob pattern for security
 */
export function validatePattern(pattern, fieldName = 'pattern') {
  if (!pattern || typeof pattern !== 'string') {
    throw new InputValidationError(`${fieldName} must be a non-empty string`);
  }

  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new InputValidationError(`${fieldName} exceeds maximum length of ${MAX_PATTERN_LENGTH}`);
  }

  // Check for path traversal
  for (const pt of PATH_TRAVERSAL_PATTERNS) {
    if (pt.test(pattern)) {
      throw new InputValidationError(`${fieldName} contains path traversal attempt`);
    }
  }

  // Check for command injection
  for (const pt of COMMAND_INJECTION_PATTERNS) {
    if (pt.test(pattern)) {
      throw new InputValidationError(`${fieldName} contains forbidden characters`);
    }
  }

  // Only allow safe glob characters
  const safeGlobRegex = /^[a-zA-Z0-9.*_\/-]+$/;
  if (!safeGlobRegex.test(pattern)) {
    throw new InputValidationError(`${fieldName} contains invalid characters`);
  }

  // Limit wildcards to prevent ReDoS
  const wildcardCount = (pattern.match(/\*/g) || []).length;
  if (wildcardCount > 4) {
    throw new InputValidationError(`${fieldName} has too many wildcards (max 4)`);
  }

  return pattern;
}

// ============================================
// Injection Detection
// ============================================

/**
 * Check for various injection attacks
 */
export function checkForInjection(value, fieldName = 'input') {
  if (typeof value !== 'string') return;

  // SQL injection
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(value)) {
      throw new InputValidationError(`${fieldName} contains potential SQL injection`);
    }
  }

  // NoSQL injection
  for (const pattern of NOSQL_INJECTION_PATTERNS) {
    if (pattern.test(value)) {
      throw new InputValidationError(`${fieldName} contains potential NoSQL injection`);
    }
  }

  // XSS
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(value)) {
      throw new InputValidationError(`${fieldName} contains potential XSS`);
    }
  }

  // Command injection (only in non-path contexts)
  if (value.includes('$(') || value.includes('`')) {
    throw new InputValidationError(`${fieldName} contains potential command injection`);
  }

  return value;
}

// ============================================
// Sanitization Functions
// ============================================

/**
 * Remove control characters from string
 */
export function removeControlChars(str) {
  if (typeof str !== 'string') return str;

  // Remove null bytes and other control chars
  let result = str;
  for (const char of DANGEROUS_CHARS) {
    result = result.split(char).join('');
  }

  // Remove other control characters (except newline and tab in some contexts)
  // eslint-disable-next-line no-control-regex
  result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return result;
}

/**
 * Sanitize HTML content (very strict - for display purposes only)
 */
export function sanitizeHtml(str) {
  if (typeof str !== 'string') return str;

  // Entity encode potentially dangerous characters
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize unknown values with basic protection
 */
function sanitizeUnknown(value, depth = 0) {
  if (depth > MAX_OBJECT_DEPTH) {
    return null;
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return removeControlChars(value).slice(0, MAX_STRING_LENGTH);
  }

  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) return 0;
    return Math.max(-MAX_INTEGER, Math.min(MAX_INTEGER, value));
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_LENGTH).map(item => sanitizeUnknown(item, depth + 1));
  }

  if (typeof value === 'object') {
    const result = {};
    for (const [key, val] of Object.entries(value)) {
      if (!PROTOTYPE_POLLUTION_KEYS.includes(key)) {
        result[key] = sanitizeUnknown(val, depth + 1);
      }
    }
    return result;
  }

  return null;
}

// ============================================
// Specialized Validators
// ============================================

/**
 * Validate UUID format
 */
export function validateUUID(value, fieldName = 'id') {
  if (typeof value !== 'string') {
    throw new InputValidationError(`${fieldName} must be a string`);
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new InputValidationError(`${fieldName} must be a valid UUID`);
  }

  return value.toLowerCase();
}

/**
 * Validate email format
 */
export function validateEmail(value, fieldName = 'email') {
  if (typeof value !== 'string') {
    throw new InputValidationError(`${fieldName} must be a string`);
  }

  if (value.length > 254) {
    throw new InputValidationError(`${fieldName} is too long`);
  }

  // Basic email regex (not perfect, but catches most issues)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    throw new InputValidationError(`${fieldName} must be a valid email`);
  }

  // Check for injection in email
  checkForInjection(value, fieldName);

  return value.toLowerCase();
}

/**
 * Validate URL format
 */
export function validateURL(value, fieldName = 'url') {
  if (typeof value !== 'string') {
    throw new InputValidationError(`${fieldName} must be a string`);
  }

  if (value.length > 2000) {
    throw new InputValidationError(`${fieldName} is too long`);
  }

  try {
    const url = new URL(value);

    // Only allow http/https
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new InputValidationError(`${fieldName} must use http or https protocol`);
    }

    // Block localhost and private IPs in production
    const hostname = url.hostname.toLowerCase();
    if (process.env.NODE_ENV === 'production') {
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')
      ) {
        throw new InputValidationError(`${fieldName} cannot target internal addresses`);
      }
    }

    return value;
  } catch (error) {
    if (error instanceof InputValidationError) throw error;
    throw new InputValidationError(`${fieldName} must be a valid URL`);
  }
}

// ============================================
// Error Class
// ============================================

export class InputValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InputValidationError';
    this.isInputValidationError = true;
    this.statusCode = 400;
  }
}

// ============================================
// Export
// ============================================

export default {
  validateInput,
  validateString,
  validateNumber,
  validateBoolean,
  validateArray,
  validateObject,
  validatePath,
  validatePattern,
  validateUUID,
  validateEmail,
  validateURL,
  checkForInjection,
  removeControlChars,
  sanitizeHtml,
  InputValidationError,
};
