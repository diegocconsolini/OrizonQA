'use client';

/**
 * TestSelector Component
 *
 * Parses test code to extract test names and allows user to select
 * which tests to run.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  Square,
  Search,
  FileCode,
  ChevronDown,
  ChevronRight,
  MinusSquare
} from 'lucide-react';

export default function TestSelector({
  testCode,
  selectedTests,
  onSelectionChange,
  framework = 'auto'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSuites, setExpandedSuites] = useState(new Set());

  // Parse test code to extract test structure
  const testStructure = useMemo(() => {
    if (!testCode) return { suites: [], standalone: [] };

    const suites = [];
    const standalone = [];

    // Regex patterns for different test structures
    const describePattern = /describe\s*\(\s*['"`]([^'"`]+)['"`]\s*,/g;
    const testPattern = /(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]\s*,/g;

    // Find all describe blocks
    let describeMatch;
    const describeBlocks = [];
    while ((describeMatch = describePattern.exec(testCode)) !== null) {
      describeBlocks.push({
        name: describeMatch[1],
        index: describeMatch.index,
        tests: []
      });
    }

    // Find all tests
    let testMatch;
    const allTests = [];
    while ((testMatch = testPattern.exec(testCode)) !== null) {
      allTests.push({
        name: testMatch[1],
        index: testMatch.index,
        id: `test-${testMatch.index}`
      });
    }

    // Associate tests with describe blocks
    if (describeBlocks.length > 0) {
      // Sort describe blocks by index
      describeBlocks.sort((a, b) => a.index - b.index);

      allTests.forEach(test => {
        // Find the closest describe block before this test
        let parentSuite = null;
        for (let i = describeBlocks.length - 1; i >= 0; i--) {
          if (describeBlocks[i].index < test.index) {
            parentSuite = describeBlocks[i];
            break;
          }
        }

        if (parentSuite) {
          parentSuite.tests.push(test);
        } else {
          standalone.push(test);
        }
      });

      // Convert to suites format
      describeBlocks.forEach((block, idx) => {
        if (block.tests.length > 0) {
          suites.push({
            id: `suite-${idx}`,
            name: block.name,
            tests: block.tests
          });
        }
      });
    } else {
      // No describe blocks, all tests are standalone
      standalone.push(...allTests);
    }

    return { suites, standalone };
  }, [testCode]);

  // Get all test IDs
  const allTestIds = useMemo(() => {
    const ids = [];
    testStructure.suites.forEach(suite => {
      suite.tests.forEach(test => ids.push(test.id));
    });
    testStructure.standalone.forEach(test => ids.push(test.id));
    return ids;
  }, [testStructure]);

  // Initialize selection with all tests
  useEffect(() => {
    if (allTestIds.length > 0 && selectedTests.length === 0) {
      onSelectionChange(allTestIds);
    }
  }, [allTestIds]);

  // Expand all suites by default
  useEffect(() => {
    const suiteIds = new Set(testStructure.suites.map(s => s.id));
    setExpandedSuites(suiteIds);
  }, [testStructure.suites]);

  // Filter tests based on search
  const filteredStructure = useMemo(() => {
    if (!searchQuery.trim()) return testStructure;

    const query = searchQuery.toLowerCase();

    const filteredSuites = testStructure.suites
      .map(suite => ({
        ...suite,
        tests: suite.tests.filter(test =>
          test.name.toLowerCase().includes(query) ||
          suite.name.toLowerCase().includes(query)
        )
      }))
      .filter(suite => suite.tests.length > 0);

    const filteredStandalone = testStructure.standalone.filter(test =>
      test.name.toLowerCase().includes(query)
    );

    return { suites: filteredSuites, standalone: filteredStandalone };
  }, [testStructure, searchQuery]);

  // Selection helpers
  const isTestSelected = (testId) => selectedTests.includes(testId);

  const isSuiteFullySelected = (suite) =>
    suite.tests.every(test => selectedTests.includes(test.id));

  const isSuitePartiallySelected = (suite) =>
    suite.tests.some(test => selectedTests.includes(test.id)) &&
    !isSuiteFullySelected(suite);

  const toggleTest = (testId) => {
    if (isTestSelected(testId)) {
      onSelectionChange(selectedTests.filter(id => id !== testId));
    } else {
      onSelectionChange([...selectedTests, testId]);
    }
  };

  const toggleSuite = (suite) => {
    const suiteTestIds = suite.tests.map(t => t.id);

    if (isSuiteFullySelected(suite)) {
      // Deselect all tests in suite
      onSelectionChange(selectedTests.filter(id => !suiteTestIds.includes(id)));
    } else {
      // Select all tests in suite
      const newSelection = [...new Set([...selectedTests, ...suiteTestIds])];
      onSelectionChange(newSelection);
    }
  };

  const toggleExpanded = (suiteId) => {
    const newExpanded = new Set(expandedSuites);
    if (newExpanded.has(suiteId)) {
      newExpanded.delete(suiteId);
    } else {
      newExpanded.add(suiteId);
    }
    setExpandedSuites(newExpanded);
  };

  const selectAll = () => onSelectionChange(allTestIds);
  const deselectAll = () => onSelectionChange([]);

  const totalTests = allTestIds.length;
  const selectedCount = selectedTests.length;

  if (!testCode) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
        <FileCode className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">No test code provided</p>
      </div>
    );
  }

  if (totalTests === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
        <FileCode className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">No tests found in code</p>
        <p className="text-slate-500 text-sm mt-1">
          Make sure your tests use describe/it/test syntax
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium">Select Tests</h3>
          <span className="text-sm text-slate-400">
            {selectedCount} of {totalTests} selected
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        {/* Select/Deselect buttons */}
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Test List */}
      <div className="max-h-80 overflow-y-auto p-2">
        {/* Suites */}
        {filteredStructure.suites.map(suite => (
          <div key={suite.id} className="mb-1">
            {/* Suite Header */}
            <div
              className="flex items-center gap-2 p-2 hover:bg-slate-700/50 rounded cursor-pointer"
              onClick={() => toggleExpanded(suite.id)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSuite(suite);
                }}
                className="text-slate-400 hover:text-white"
              >
                {isSuiteFullySelected(suite) ? (
                  <CheckSquare className="w-4 h-4 text-primary" />
                ) : isSuitePartiallySelected(suite) ? (
                  <MinusSquare className="w-4 h-4 text-primary/60" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>

              {expandedSuites.has(suite.id) ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}

              <span className="text-white text-sm font-medium">{suite.name}</span>
              <span className="text-slate-500 text-xs">({suite.tests.length})</span>
            </div>

            {/* Suite Tests */}
            {expandedSuites.has(suite.id) && (
              <div className="ml-6 border-l border-slate-700 pl-2">
                {suite.tests.map(test => (
                  <div
                    key={test.id}
                    onClick={() => toggleTest(test.id)}
                    className="flex items-center gap-2 p-2 hover:bg-slate-700/50 rounded cursor-pointer"
                  >
                    {isTestSelected(test.id) ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-slate-300 text-sm">{test.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Standalone Tests */}
        {filteredStructure.standalone.length > 0 && (
          <div className="mt-2">
            {filteredStructure.suites.length > 0 && (
              <div className="text-xs text-slate-500 px-2 py-1">Standalone Tests</div>
            )}
            {filteredStructure.standalone.map(test => (
              <div
                key={test.id}
                onClick={() => toggleTest(test.id)}
                className="flex items-center gap-2 p-2 hover:bg-slate-700/50 rounded cursor-pointer"
              >
                {isTestSelected(test.id) ? (
                  <CheckSquare className="w-4 h-4 text-primary" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-slate-300 text-sm">{test.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {filteredStructure.suites.length === 0 && filteredStructure.standalone.length === 0 && (
          <div className="p-4 text-center text-slate-500 text-sm">
            No tests match your search
          </div>
        )}
      </div>
    </div>
  );
}
