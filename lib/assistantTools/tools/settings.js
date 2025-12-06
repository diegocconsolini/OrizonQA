/**
 * Settings Tools Handler
 *
 * Handles user settings and configuration operations.
 */

import { getAISettings, updateAISettings } from '@/lib/db-ai-assistant.js';

/**
 * Execute a settings tool
 */
export async function executeSettingsTool(toolName, input, context) {
  const { userId } = context;

  try {
    switch (toolName) {
      case 'get_settings':
        return await getSettings(userId);
      case 'update_api_key':
        return await updateApiKey(input, userId);
      case 'clear_cache':
        return await clearCache(userId);
      case 'reset_settings':
        return await resetSettings(userId);
      default:
        return { success: false, error: `Unknown settings tool: ${toolName}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getSettings(userId) {
  const settings = await getAISettings(userId);

  return {
    success: true,
    data: {
      settings: {
        hasApiKey: !!settings?.claude_api_key_encrypted,
        defaultModel: settings?.default_model || 'claude-sonnet-4-20250514',
        defaultFramework: settings?.default_framework || 'jest',
        defaultFormat: settings?.default_format || 'markdown',
        theme: settings?.theme || 'dark',
        notifications: settings?.notifications ?? true,
      },
    },
  };
}

async function updateApiKey(input, userId) {
  // Note: Actual API key update happens via the settings API with encryption
  // This tool just initiates the flow
  return {
    success: true,
    data: {
      message: 'To update your API key, please use the Settings page for secure handling.',
      redirectTo: '/settings',
    },
    action: {
      type: 'NAVIGATE',
      payload: { path: '/settings', tab: 'integrations' },
    },
  };
}

async function clearCache(userId) {
  // Clear IndexedDB cache on client side
  return {
    success: true,
    data: {
      message: 'Cache clear initiated. Local storage and IndexedDB will be cleared.',
    },
    action: {
      type: 'CLEAR_CACHE',
      payload: { clearIndexedDB: true, clearLocalStorage: true },
    },
  };
}

async function resetSettings(userId) {
  await updateAISettings(userId, {
    default_model: 'claude-sonnet-4-20250514',
    default_framework: 'jest',
    default_format: 'markdown',
    theme: 'dark',
    notifications: true,
  });

  return {
    success: true,
    data: {
      message: 'Settings reset to defaults',
    },
    action: {
      type: 'SETTINGS_RESET',
      payload: {},
    },
  };
}

export default { executeSettingsTool };
