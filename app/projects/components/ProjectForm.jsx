'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, AlertCircle } from 'lucide-react';

/**
 * ProjectForm Component
 *
 * Form for creating or editing projects
 */
export default function ProjectForm({ initialData = null, onCancel }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    key: initialData?.key || '',
    description: initialData?.description || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Auto-generate key from name if creating new project
    if (name === 'name' && !initialData) {
      const autoKey = value
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .split(/\s+/)
        .map(word => word.slice(0, 3))
        .join('')
        .slice(0, 10);
      setFormData(prev => ({ ...prev, name: value, key: autoKey }));
    } else if (name === 'key') {
      // Ensure key is uppercase and alphanumeric
      const sanitized = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, key: sanitized }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }
    if (!formData.key.trim()) {
      setError('Project key is required');
      return;
    }
    if (formData.key.length < 2) {
      setError('Project key must be at least 2 characters');
      return;
    }

    try {
      setLoading(true);

      const url = initialData
        ? `/api/projects/${initialData.id}`
        : '/api/projects';

      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save project');
      }

      // Redirect to project page
      router.push(`/projects/${data.project.id}`);
    } catch (err) {
      console.error('Error saving project:', err);
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

      {/* Project Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
          Project Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          disabled={loading}
          placeholder="My E-Commerce Project"
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
          required
        />
        <p className="text-xs text-slate-400 mt-1">
          A descriptive name for your project
        </p>
      </div>

      {/* Project Key */}
      <div>
        <label htmlFor="key" className="block text-sm font-medium text-slate-300 mb-2">
          Project Key <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="key"
          name="key"
          value={formData.key}
          onChange={handleChange}
          disabled={loading || !!initialData}
          placeholder="ECOM"
          maxLength={10}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50 font-mono"
          required
        />
        <p className="text-xs text-slate-400 mt-1">
          {initialData
            ? 'Project key cannot be changed after creation'
            : '2-10 uppercase alphanumeric characters (e.g., PROJ, AUTH, ECOM)'}
        </p>
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
          placeholder="Brief description of what this project tests..."
          rows={4}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50 resize-none"
        />
        <p className="text-xs text-slate-400 mt-1">
          Optional description to help team members understand the project scope
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {initialData ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {initialData ? 'Update Project' : 'Create Project'}
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
