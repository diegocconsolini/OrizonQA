'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Loader, CheckCircle, AlertCircle, TestTube2 } from 'lucide-react';
import { parseAITestCases, parseUserStoriesToTests } from '@/lib/ai-test-parser';

export default function ImportTestsModal({ isOpen, onClose, testCasesText, userStoriesText }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [parsedTests, setParsedTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      parseTests();
    }
  }, [isOpen, testCasesText, userStoriesText]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      const data = await response.json();

      if (response.ok) {
        setProjects(data.projects || []);
      } else {
        setError('Failed to load projects');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const parseTests = () => {
    let tests = [];

    // Parse test cases
    if (testCasesText) {
      const parsedTestCases = parseAITestCases(testCasesText);
      tests = [...tests, ...parsedTestCases];
    }

    // Parse user stories as tests
    if (userStoriesText) {
      const parsedStories = parseUserStoriesToTests(userStoriesText);
      tests = [...tests, ...parsedStories];
    }

    setParsedTests(tests);

    // Select all by default
    const allIds = new Set(tests.map((_, idx) => idx));
    setSelectedTests(allIds);
  };

  const toggleTest = (index) => {
    const newSelected = new Set(selectedTests);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTests(newSelected);
  };

  const toggleAll = () => {
    if (selectedTests.size === parsedTests.length) {
      setSelectedTests(new Set());
    } else {
      setSelectedTests(new Set(parsedTests.map((_, idx) => idx)));
    }
  };

  const handleImport = async () => {
    if (!selectedProject) {
      setError('Please select a project');
      return;
    }

    if (selectedTests.size === 0) {
      setError('Please select at least one test to import');
      return;
    }

    setImporting(true);
    setError('');
    setImportResult(null);

    try {
      const testsToImport = parsedTests.filter((_, idx) => selectedTests.has(idx));

      const response = await fetch(`/api/projects/${selectedProject}/tests/bulk-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tests: testsToImport
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setImportResult(data.results);
      } else {
        setError(data.error || 'Failed to import tests');
      }
    } catch (err) {
      console.error('Error importing tests:', err);
      setError('Failed to import tests');
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Import AI-Generated Tests</h2>
              <p className="text-sm text-slate-400">
                {parsedTests.length} test{parsedTests.length !== 1 ? 's' : ''} detected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {importResult && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-start gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-400 font-medium">
                    Import Complete!
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    Successfully imported {importResult.success.length} of {importResult.total} test cases.
                  </p>
                  {importResult.failed.length > 0 && (
                    <p className="text-orange-400 text-sm mt-1">
                      {importResult.failed.length} test{importResult.failed.length !== 1 ? 's' : ''} failed to import.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Project Selection */}
          {!importResult && (
            <>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Select Project <span className="text-red-400">*</span>
                </label>
                {loading ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader className="w-4 h-4 animate-spin" />
                    Loading projects...
                  </div>
                ) : (
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    <option value="">Choose a project...</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} ({project.key})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Test List */}
              {parsedTests.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-white">
                      Select Tests to Import
                    </label>
                    <button
                      onClick={toggleAll}
                      className="text-sm text-cyan-400 hover:text-cyan-300"
                    >
                      {selectedTests.size === parsedTests.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {parsedTests.map((test, index) => (
                      <div
                        key={index}
                        onClick={() => toggleTest(index)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedTests.has(index)
                            ? 'bg-cyan-500/10 border-cyan-500/30'
                            : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedTests.has(index)}
                            onChange={() => toggleTest(index)}
                            className="mt-1 w-4 h-4 bg-slate-800 border-slate-700 rounded text-cyan-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <TestTube2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                              <h3 className="font-medium text-white truncate">{test.title}</h3>
                            </div>
                            {test.description && (
                              <p className="text-sm text-slate-400 line-clamp-2 mt-1">
                                {test.description.substring(0, 150)}...
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded">
                                {test.type}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded">
                                {test.priority}
                              </span>
                              {test.steps.length > 0 && (
                                <span className="text-xs text-slate-400">
                                  {test.steps.length} step{test.steps.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parsedTests.length === 0 && (
                <div className="text-center py-12">
                  <TestTube2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No tests detected in the AI output.</p>
                  <p className="text-slate-500 text-sm mt-1">
                    Make sure you have generated test cases or user stories first.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            disabled={importing}
          >
            {importResult ? 'Close' : 'Cancel'}
          </button>
          {!importResult && parsedTests.length > 0 && (
            <button
              onClick={handleImport}
              disabled={importing || !selectedProject || selectedTests.size === 0}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import {selectedTests.size} Test{selectedTests.size !== 1 ? 's' : ''}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
