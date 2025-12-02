'use client';

import { useState } from 'react';
import { Save, Loader, Plus, X } from 'lucide-react';

export default function TestCaseForm({ projectId, testCase, onCancel, onSuccess }) {
  const isEditMode = !!testCase;

  const [formData, setFormData] = useState({
    title: testCase?.title || '',
    description: testCase?.description || '',
    preconditions: testCase?.preconditions || '',
    steps: testCase?.steps || [{ step: '', expected: '', data: '' }],
    expected_result: testCase?.expected_result || '',
    priority: testCase?.priority || 'Medium',
    type: testCase?.type || 'Functional',
    status: testCase?.status || 'Draft',
    automated: testCase?.automated || false,
    tags: testCase?.tags || []
  });

  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const priorities = ['Critical', 'High', 'Medium', 'Low'];
  const types = ['Functional', 'Integration', 'E2E', 'Performance', 'Security', 'API', 'UI'];
  const statuses = ['Draft', 'Ready'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleStepChange = (index, field, value) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, { step: '', expected: '', data: '' }]
    }));
  };

  const removeStep = (index) => {
    if (formData.steps.length > 1) {
      setFormData(prev => ({
        ...prev,
        steps: prev.steps.filter((_, i) => i !== index)
      }));
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const url = isEditMode
        ? `/api/projects/${projectId}/tests/${testCase.id}`
        : `/api/projects/${projectId}/tests`;

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${isEditMode ? 'update' : 'create'} test case`);
      }

      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      console.error('Error saving test case:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className={`w-full px-4 py-2 bg-slate-800 border ${
            validationErrors.title ? 'border-red-500' : 'border-slate-700'
          } rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50`}
          placeholder="Enter test case title"
        />
        {validationErrors.title && (
          <p className="mt-1 text-sm text-red-400">{validationErrors.title}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          placeholder="Enter test case description"
        />
      </div>

      {/* Preconditions */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Preconditions
        </label>
        <textarea
          value={formData.preconditions}
          onChange={(e) => handleInputChange('preconditions', e.target.value)}
          rows={2}
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          placeholder="Enter preconditions (e.g., User must be logged in)"
        />
      </div>

      {/* Test Steps */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Test Steps
        </label>
        <div className="space-y-4">
          {formData.steps.map((step, index) => (
            <div key={index} className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-slate-300">Step {index + 1}</span>
                {formData.steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={step.step}
                    onChange={(e) => handleStepChange(index, 'step', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    placeholder="Step description"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={step.expected}
                    onChange={(e) => handleStepChange(index, 'expected', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    placeholder="Expected result"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={step.data}
                    onChange={(e) => handleStepChange(index, 'data', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    placeholder="Test data (optional)"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addStep}
          className="mt-3 flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Step
        </button>
      </div>

      {/* Expected Result */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Expected Result
        </label>
        <textarea
          value={formData.expected_result}
          onChange={(e) => handleInputChange('expected_result', e.target.value)}
          rows={2}
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          placeholder="Overall expected result"
        />
      </div>

      {/* Priority, Type, Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) => handleInputChange('priority', e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            {priorities.map(priority => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            {types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Automated Checkbox */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.automated}
            onChange={(e) => handleInputChange('automated', e.target.checked)}
            className="w-4 h-4 bg-slate-800 border-slate-700 rounded text-cyan-500 focus:ring-2 focus:ring-cyan-500/50"
          />
          <span className="text-sm font-medium text-white">Automated Test</span>
        </label>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Tags
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleTagInputKeyPress}
            className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            placeholder="Add a tag"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1 bg-slate-700 text-slate-200 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isEditMode ? 'Update Test Case' : 'Create Test Case'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
