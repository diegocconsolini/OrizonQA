'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, AlertCircle } from 'lucide-react';

/**
 * RequirementForm Component
 *
 * Form for creating or editing requirements
 */
export default function RequirementForm({ projectId, initialData = null, onCancel }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    key: initialData?.key || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: initialData?.type || 'Story',
    status: initialData?.status || 'Open',
    priority: initialData?.priority || 'Medium',
    version: initialData?.version || '',
    external_id: initialData?.external_id || '',
    external_url: initialData?.external_url || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requirementTypes = ['Story', 'Epic', 'Bug', 'Feature', 'Task'];
  const statuses = ['Open', 'In Progress', 'Done', 'Cancelled'];
  const priorities = ['Critical', 'High', 'Medium', 'Low'];

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Auto-generate key from title if creating new requirement
    if (name === 'title' && !initialData) {
      const autoKey = 'REQ-' + value
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .split(/\s+/)
        .slice(0, 3)
        .join('-')
        .slice(0, 20);
      setFormData(prev => ({ ...prev, title: value, key: autoKey }));
    } else if (name === 'key') {
      // Sanitize key
      const sanitized = value.toUpperCase().replace(/[^A-Z0-9-_]/g, '').slice(0, 50);
      setFormData(prev => ({ ...prev, key: sanitized }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.key.trim()) {
      setError('Requirement key is required');
      return;
    }
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setLoading(true);

      const url = initialData
        ? `/api/projects/${projectId}/requirements/${initialData.id}`
        : `/api/projects/${projectId}/requirements`;

      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save requirement');
      }

      // Redirect to requirement page or requirements list
      if (data.requirement) {
        router.push(`/projects/${projectId}/requirements/${data.requirement.id}`);
      } else {
        router.push(`/projects/${projectId}/requirements`);
      }
    } catch (err) {
      console.error('Error saving requirement:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Error</p>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Requirement Key */}
        <div>
          <label htmlFor="key" className="block text-sm font-medium text-slate-300 mb-2">
            Requirement Key <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="key"
            name="key"
            value={formData.key}
            onChange={handleChange}
            disabled={loading || !!initialData}
            placeholder="REQ-1"
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50 font-mono"
            required
          />
          <p className="text-xs text-slate-400 mt-1">
            {initialData
              ? 'Requirement key cannot be changed'
              : 'Unique identifier (e.g., REQ-1, STORY-42)'}
          </p>
        </div>

        {/* Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-slate-300 mb-2">
            Type
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50"
          >
            {requirementTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          disabled={loading}
          placeholder="User should be able to login with email and password"
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          disabled={loading}
          placeholder="Detailed description of the requirement..."
          rows={4}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-slate-300 mb-2">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50"
          >
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-slate-300 mb-2">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50"
          >
            {priorities.map(priority => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </div>

        {/* Version */}
        <div>
          <label htmlFor="version" className="block text-sm font-medium text-slate-300 mb-2">
            Version
          </label>
          <input
            type="text"
            id="version"
            name="version"
            value={formData.version}
            onChange={handleChange}
            disabled={loading}
            placeholder="v1.0, Sprint 42"
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50"
          />
        </div>
      </div>

      {/* External Integration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="external_id" className="block text-sm font-medium text-slate-300 mb-2">
            External ID
          </label>
          <input
            type="text"
            id="external_id"
            name="external_id"
            value={formData.external_id}
            onChange={handleChange}
            disabled={loading}
            placeholder="JIRA-123, AZ-456"
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50"
          />
          <p className="text-xs text-slate-400 mt-1">
            Link to external system (Jira, Azure DevOps, etc.)
          </p>
        </div>

        <div>
          <label htmlFor="external_url" className="block text-sm font-medium text-slate-300 mb-2">
            External URL
          </label>
          <input
            type="url"
            id="external_url"
            name="external_url"
            value={formData.external_url}
            onChange={handleChange}
            disabled={loading}
            placeholder="https://jira.company.com/browse/..."
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {initialData ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {initialData ? 'Update Requirement' : 'Create Requirement'}
            </>
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-700 text-white px-6 py-3 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
