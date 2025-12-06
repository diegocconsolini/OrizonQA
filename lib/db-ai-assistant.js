/**
 * AI Assistant Database Module
 *
 * Database tables for the AI Assistant tools system.
 * Includes settings, action logs, tool configuration, and confirmations.
 */

import { query } from './db.js';

/**
 * Initialize all AI Assistant tables
 */
export async function initAIAssistantTables() {
  try {
    // Table 1: AI Settings (per-user)
    await query(`
      CREATE TABLE IF NOT EXISTS ai_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        permission_level INTEGER DEFAULT 3,
        enabled_tools JSONB DEFAULT '[]',
        disabled_tools JSONB DEFAULT '[]',
        rate_limit_multiplier DECIMAL(3,2) DEFAULT 1.0,
        require_confirmation BOOLEAN DEFAULT true,
        audit_level VARCHAR(20) DEFAULT 'standard',
        custom_config JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_ai_settings_user ON ai_settings(user_id);`);

    // Table 2: AI Action Log (audit trail)
    await query(`
      CREATE TABLE IF NOT EXISTS ai_action_log (
        id VARCHAR(50) PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        category VARCHAR(50) NOT NULL,
        level INTEGER NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        session_id VARCHAR(255),
        tool_name VARCHAR(100),
        input TEXT,
        result TEXT,
        success BOOLEAN,
        error TEXT,
        error_type VARCHAR(50),
        page VARCHAR(100),
        duration INTEGER,
        ip_address INET,
        user_agent TEXT,
        metadata JSONB DEFAULT '{}'
      );
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_ai_action_log_user ON ai_action_log(user_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_ai_action_log_timestamp ON ai_action_log(timestamp);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_ai_action_log_category ON ai_action_log(category);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_ai_action_log_level ON ai_action_log(level);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_ai_action_log_tool ON ai_action_log(tool_name);`);

    // Table 3: AI Tool Configuration (admin-level)
    await query(`
      CREATE TABLE IF NOT EXISTS ai_tool_config (
        id SERIAL PRIMARY KEY,
        tool_name VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(255),
        description TEXT,
        category VARCHAR(50),
        permission_level INTEGER DEFAULT 3,
        is_dangerous BOOLEAN DEFAULT false,
        is_enabled BOOLEAN DEFAULT true,
        rate_limit_window_ms INTEGER DEFAULT 60000,
        rate_limit_max INTEGER DEFAULT 30,
        requires_confirmation BOOLEAN DEFAULT false,
        confirmation_message TEXT,
        custom_config JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_ai_tool_config_name ON ai_tool_config(tool_name);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_ai_tool_config_category ON ai_tool_config(category);`);

    // Table 4: AI Pending Confirmations
    await query(`
      CREATE TABLE IF NOT EXISTS ai_pending_confirmations (
        id VARCHAR(100) PRIMARY KEY,
        token VARCHAR(100) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_id VARCHAR(255),
        tool_name VARCHAR(100) NOT NULL,
        input JSONB,
        type VARCHAR(50) DEFAULT 'destructive',
        message TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        confirmed_at TIMESTAMP,
        denied_at TIMESTAMP,
        executed_at TIMESTAMP,
        metadata JSONB DEFAULT '{}'
      );
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_ai_pending_confirmations_user ON ai_pending_confirmations(user_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_ai_pending_confirmations_token ON ai_pending_confirmations(token);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_ai_pending_confirmations_status ON ai_pending_confirmations(status);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_ai_pending_confirmations_expires ON ai_pending_confirmations(expires_at);`);

    console.log('AI Assistant tables initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize AI Assistant tables:', error);
    throw error;
  }
}

/**
 * Seed default tool configurations
 */
export async function seedToolConfigs() {
  const tools = [
    // Navigation tools (L1-L2)
    { tool_name: 'get_current_page', display_name: 'Get Current Page', category: 'navigation', permission_level: 1 },
    { tool_name: 'suggest_navigation', display_name: 'Suggest Navigation', category: 'navigation', permission_level: 2 },

    // Read tools (L1)
    { tool_name: 'list_available_files', display_name: 'List Files', category: 'files', permission_level: 1 },
    { tool_name: 'get_file_content', display_name: 'Get File Content', category: 'files', permission_level: 1 },
    { tool_name: 'get_current_config', display_name: 'Get Config', category: 'config', permission_level: 1 },
    { tool_name: 'get_analysis_status', display_name: 'Get Analysis Status', category: 'analysis', permission_level: 1 },
    { tool_name: 'get_analysis_results', display_name: 'Get Results', category: 'analysis', permission_level: 1 },
    { tool_name: 'list_quick_actions', display_name: 'List Quick Actions', category: 'config', permission_level: 1 },

    // Write tools (L3)
    { tool_name: 'select_file', display_name: 'Select File', category: 'files', permission_level: 3 },
    { tool_name: 'select_files_by_pattern', display_name: 'Select by Pattern', category: 'files', permission_level: 3 },
    { tool_name: 'select_all_code_files', display_name: 'Select All Code', category: 'files', permission_level: 3 },
    { tool_name: 'clear_file_selection', display_name: 'Clear Selection', category: 'files', permission_level: 3 },
    { tool_name: 'set_analysis_options', display_name: 'Set Options', category: 'config', permission_level: 3 },
    { tool_name: 'set_output_format', display_name: 'Set Format', category: 'config', permission_level: 3 },
    { tool_name: 'set_test_framework', display_name: 'Set Framework', category: 'config', permission_level: 3 },
    { tool_name: 'set_additional_context', display_name: 'Set Context', category: 'config', permission_level: 3 },
    { tool_name: 'select_quick_action', display_name: 'Quick Action', category: 'config', permission_level: 3 },
    { tool_name: 'start_analysis', display_name: 'Start Analysis', category: 'analysis', permission_level: 3 },
    { tool_name: 'cancel_analysis', display_name: 'Cancel Analysis', category: 'analysis', permission_level: 3 },

    // Project tools
    { tool_name: 'list_projects', display_name: 'List Projects', category: 'projects', permission_level: 1 },
    { tool_name: 'get_project', display_name: 'Get Project', category: 'projects', permission_level: 1 },
    { tool_name: 'create_project', display_name: 'Create Project', category: 'projects', permission_level: 3 },
    { tool_name: 'update_project', display_name: 'Update Project', category: 'projects', permission_level: 3 },
    { tool_name: 'delete_project', display_name: 'Delete Project', category: 'projects', permission_level: 4, is_dangerous: true, requires_confirmation: true },

    // Todo tools
    { tool_name: 'list_todos', display_name: 'List Todos', category: 'todos', permission_level: 1 },
    { tool_name: 'get_todo', display_name: 'Get Todo', category: 'todos', permission_level: 1 },
    { tool_name: 'create_todo', display_name: 'Create Todo', category: 'todos', permission_level: 3 },
    { tool_name: 'update_todo', display_name: 'Update Todo', category: 'todos', permission_level: 3 },
    { tool_name: 'complete_todo', display_name: 'Complete Todo', category: 'todos', permission_level: 3 },
    { tool_name: 'delete_todo', display_name: 'Delete Todo', category: 'todos', permission_level: 4, is_dangerous: true, requires_confirmation: true },

    // Dangerous tools (L4)
    { tool_name: 'bulk_delete', display_name: 'Bulk Delete', category: 'admin', permission_level: 4, is_dangerous: true, requires_confirmation: true },
    { tool_name: 'clear_history', display_name: 'Clear History', category: 'admin', permission_level: 4, is_dangerous: true, requires_confirmation: true },
    { tool_name: 'update_api_key', display_name: 'Update API Key', category: 'settings', permission_level: 4, is_dangerous: true, requires_confirmation: true },
    { tool_name: 'clear_cache', display_name: 'Clear Cache', category: 'settings', permission_level: 4, is_dangerous: true, requires_confirmation: true },
    { tool_name: 'reset_settings', display_name: 'Reset Settings', category: 'settings', permission_level: 4, is_dangerous: true, requires_confirmation: true },
  ];

  for (const tool of tools) {
    await query(`
      INSERT INTO ai_tool_config (
        tool_name, display_name, category, permission_level,
        is_dangerous, requires_confirmation
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (tool_name) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        category = EXCLUDED.category,
        permission_level = EXCLUDED.permission_level,
        is_dangerous = EXCLUDED.is_dangerous,
        requires_confirmation = EXCLUDED.requires_confirmation,
        updated_at = CURRENT_TIMESTAMP
    `, [
      tool.tool_name,
      tool.display_name,
      tool.category,
      tool.permission_level,
      tool.is_dangerous || false,
      tool.requires_confirmation || false,
    ]);
  }

  console.log(`Seeded ${tools.length} tool configurations`);
  return tools.length;
}

// ============================================
// Settings CRUD
// ============================================

export async function getAISettings(userId) {
  const result = await query(
    'SELECT * FROM ai_settings WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

export async function createOrUpdateAISettings(userId, settings) {
  const result = await query(`
    INSERT INTO ai_settings (user_id, permission_level, enabled_tools, disabled_tools,
      rate_limit_multiplier, require_confirmation, audit_level, custom_config)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (user_id) DO UPDATE SET
      permission_level = EXCLUDED.permission_level,
      enabled_tools = EXCLUDED.enabled_tools,
      disabled_tools = EXCLUDED.disabled_tools,
      rate_limit_multiplier = EXCLUDED.rate_limit_multiplier,
      require_confirmation = EXCLUDED.require_confirmation,
      audit_level = EXCLUDED.audit_level,
      custom_config = EXCLUDED.custom_config,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `, [
    userId,
    settings.permission_level || 3,
    JSON.stringify(settings.enabled_tools || []),
    JSON.stringify(settings.disabled_tools || []),
    settings.rate_limit_multiplier || 1.0,
    settings.require_confirmation ?? true,
    settings.audit_level || 'standard',
    JSON.stringify(settings.custom_config || {}),
  ]);
  return result.rows[0];
}

// ============================================
// Action Log CRUD
// ============================================

export async function logAction(entry) {
  await query(`
    INSERT INTO ai_action_log (
      id, timestamp, category, level, user_id, session_id,
      tool_name, input, result, success, error, error_type,
      page, duration, ip_address, user_agent, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
  `, [
    entry.id,
    entry.timestamp,
    entry.category,
    entry.level,
    entry.userId,
    entry.sessionId,
    entry.toolName,
    entry.input,
    entry.result,
    entry.success,
    entry.error,
    entry.errorType,
    entry.page,
    entry.duration,
    entry.ipAddress,
    entry.userAgent,
    JSON.stringify(entry.metadata || {}),
  ]);
}

export async function getActionLogs(options = {}) {
  const { userId, category, level, limit = 100, offset = 0 } = options;

  let whereClause = [];
  let params = [];
  let paramIndex = 1;

  if (userId) {
    whereClause.push(`user_id = $${paramIndex++}`);
    params.push(userId);
  }
  if (category) {
    whereClause.push(`category = $${paramIndex++}`);
    params.push(category);
  }
  if (level !== undefined) {
    whereClause.push(`level >= $${paramIndex++}`);
    params.push(level);
  }

  const where = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

  params.push(limit, offset);
  const result = await query(`
    SELECT * FROM ai_action_log
    ${where}
    ORDER BY timestamp DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex}
  `, params);

  return result.rows;
}

// ============================================
// Tool Config CRUD
// ============================================

export async function getToolConfigs() {
  const result = await query('SELECT * FROM ai_tool_config ORDER BY category, tool_name');
  return result.rows;
}

export async function getToolConfig(toolName) {
  const result = await query(
    'SELECT * FROM ai_tool_config WHERE tool_name = $1',
    [toolName]
  );
  return result.rows[0] || null;
}

export async function updateToolConfig(toolName, config) {
  const result = await query(`
    UPDATE ai_tool_config SET
      display_name = COALESCE($2, display_name),
      description = COALESCE($3, description),
      permission_level = COALESCE($4, permission_level),
      is_dangerous = COALESCE($5, is_dangerous),
      is_enabled = COALESCE($6, is_enabled),
      rate_limit_window_ms = COALESCE($7, rate_limit_window_ms),
      rate_limit_max = COALESCE($8, rate_limit_max),
      requires_confirmation = COALESCE($9, requires_confirmation),
      confirmation_message = COALESCE($10, confirmation_message),
      custom_config = COALESCE($11, custom_config),
      updated_at = CURRENT_TIMESTAMP
    WHERE tool_name = $1
    RETURNING *
  `, [
    toolName,
    config.display_name,
    config.description,
    config.permission_level,
    config.is_dangerous,
    config.is_enabled,
    config.rate_limit_window_ms,
    config.rate_limit_max,
    config.requires_confirmation,
    config.confirmation_message,
    config.custom_config ? JSON.stringify(config.custom_config) : null,
  ]);
  return result.rows[0];
}

// ============================================
// Confirmation CRUD
// ============================================

export async function saveConfirmation(confirmation) {
  await query(`
    INSERT INTO ai_pending_confirmations (
      id, token, user_id, session_id, tool_name, input,
      type, message, status, expires_at, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `, [
    confirmation.id,
    confirmation.token,
    confirmation.userId,
    confirmation.sessionId,
    confirmation.toolName,
    JSON.stringify(confirmation.input),
    confirmation.type,
    confirmation.message,
    confirmation.status,
    new Date(confirmation.expiresAt).toISOString(),
    JSON.stringify(confirmation.metadata || {}),
  ]);
}

export async function getConfirmationByToken(token) {
  const result = await query(
    'SELECT * FROM ai_pending_confirmations WHERE token = $1',
    [token]
  );
  return result.rows[0] || null;
}

export async function updateConfirmationStatus(token, status) {
  const updates = { status };
  const now = new Date().toISOString();

  if (status === 'confirmed') updates.confirmed_at = now;
  if (status === 'denied') updates.denied_at = now;
  if (status === 'executed') updates.executed_at = now;

  await query(`
    UPDATE ai_pending_confirmations SET
      status = $2,
      confirmed_at = $3,
      denied_at = $4,
      executed_at = $5
    WHERE token = $1
  `, [token, status, updates.confirmed_at, updates.denied_at, updates.executed_at]);
}

export async function cleanupExpiredConfirmations() {
  await query(`
    DELETE FROM ai_pending_confirmations
    WHERE expires_at < CURRENT_TIMESTAMP AND status = 'pending'
  `);
}

// ============================================
// Analytics
// ============================================

export async function getToolUsageStats(days = 30) {
  const result = await query(`
    SELECT
      tool_name,
      COUNT(*) as total_calls,
      SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful,
      SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as failed,
      AVG(duration) as avg_duration
    FROM ai_action_log
    WHERE timestamp >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
      AND tool_name IS NOT NULL
    GROUP BY tool_name
    ORDER BY total_calls DESC
  `);
  return result.rows;
}

export async function getSecurityEvents(days = 7) {
  const result = await query(`
    SELECT * FROM ai_action_log
    WHERE timestamp >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
      AND level >= 2
    ORDER BY timestamp DESC
    LIMIT 100
  `);
  return result.rows;
}

export default {
  initAIAssistantTables,
  seedToolConfigs,
  getAISettings,
  createOrUpdateAISettings,
  logAction,
  getActionLogs,
  getToolConfigs,
  getToolConfig,
  updateToolConfig,
  saveConfirmation,
  getConfirmationByToken,
  updateConfirmationStatus,
  cleanupExpiredConfirmations,
  getToolUsageStats,
  getSecurityEvents,
};
