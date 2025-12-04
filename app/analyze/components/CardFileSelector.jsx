'use client';

/**
 * CardFileSelector Component
 *
 * Per-card file selection for expert mode.
 * Allows selecting different files for each output card:
 * - User Stories
 * - Test Cases
 * - Acceptance Criteria
 */

import { useState, useMemo } from 'react';
import {
  FileText,
  TestTube,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Folder,
  File,
  Check,
  X,
  Link2,
  Link2Off,
  Filter,
  Search
} from 'lucide-react';

const CARDS = [
  {
    id: 'userStories',
    name: 'User Stories',
    icon: FileText,
    color: 'blue',
    description: 'Select files to generate user stories from'
  },
  {
    id: 'testCases',
    name: 'Test Cases',
    icon: TestTube,
    color: 'green',
    description: 'Select files to generate test cases for'
  },
  {
    id: 'acceptanceCriteria',
    name: 'Acceptance Criteria',
    icon: CheckSquare,
    color: 'purple',
    description: 'Select files to derive acceptance criteria from'
  }
];

const COLOR_CLASSES = {
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    activeBg: 'bg-blue-500/20',
    activeBorder: 'border-blue-500'
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    activeBg: 'bg-green-500/20',
    activeBorder: 'border-green-500'
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    activeBg: 'bg-purple-500/20',
    activeBorder: 'border-purple-500'
  }
};

// File extension patterns for quick selection
const QUICK_PATTERNS = {
  frontend: {
    label: 'Frontend',
    patterns: ['.jsx', '.tsx', '.vue', '.svelte', 'components/', 'pages/']
  },
  backend: {
    label: 'Backend',
    patterns: ['.js', '.ts', 'api/', 'routes/', 'controllers/', 'services/']
  },
  tests: {
    label: 'Tests',
    patterns: ['.test.', '.spec.', '__tests__/', 'tests/']
  },
  config: {
    label: 'Config',
    patterns: ['.json', '.yml', '.yaml', '.env', 'config/']
  }
};

export default function CardFileSelector({
  selectedFiles = [],
  fileTree = [],
  cardFiles = {},
  onCardFilesChange,
  onToggleSharedFiles,
  useSharedFiles = true
}) {
  const [activeCard, setActiveCard] = useState('userStories');
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Get current card's selected files
  const currentCardFiles = cardFiles[activeCard] || [];

  // Filter files based on search
  const filteredFiles = useMemo(() => {
    if (!searchTerm) return selectedFiles;
    const term = searchTerm.toLowerCase();
    return selectedFiles.filter(f => f.toLowerCase().includes(term));
  }, [selectedFiles, searchTerm]);

  // Check if a file is selected for current card
  const isFileSelected = (filePath) => {
    return currentCardFiles.includes(filePath);
  };

  // Toggle file selection for current card
  const toggleFile = (filePath) => {
    const newFiles = isFileSelected(filePath)
      ? currentCardFiles.filter(f => f !== filePath)
      : [...currentCardFiles, filePath];
    onCardFilesChange(activeCard, newFiles);
  };

  // Select all files for current card
  const selectAll = () => {
    onCardFilesChange(activeCard, [...selectedFiles]);
  };

  // Clear all files for current card
  const clearAll = () => {
    onCardFilesChange(activeCard, []);
  };

  // Quick select by pattern
  const selectByPattern = (patternKey) => {
    const { patterns } = QUICK_PATTERNS[patternKey];
    const matching = selectedFiles.filter(file =>
      patterns.some(p => file.toLowerCase().includes(p.toLowerCase()))
    );
    // Add to existing selection
    const newFiles = [...new Set([...currentCardFiles, ...matching])];
    onCardFilesChange(activeCard, newFiles);
  };

  // Toggle folder expansion
  const toggleFolder = (folderPath) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  // Build folder structure from flat file list
  const folderStructure = useMemo(() => {
    const structure = {};
    filteredFiles.forEach(filePath => {
      const parts = filePath.split('/');
      let current = structure;
      parts.forEach((part, idx) => {
        if (idx === parts.length - 1) {
          // File
          if (!current._files) current._files = [];
          current._files.push(filePath);
        } else {
          // Folder
          if (!current[part]) current[part] = {};
          current = current[part];
        }
      });
    });
    return structure;
  }, [filteredFiles]);

  // Render folder tree recursively
  const renderTree = (node, path = '', depth = 0) => {
    const folders = Object.keys(node).filter(k => k !== '_files').sort();
    const files = (node._files || []).sort();

    return (
      <div style={{ marginLeft: depth > 0 ? '16px' : 0 }}>
        {folders.map(folderName => {
          const folderPath = path ? `${path}/${folderName}` : folderName;
          const isExpanded = expandedFolders.has(folderPath);

          return (
            <div key={folderPath}>
              <button
                onClick={() => toggleFolder(folderPath)}
                className="flex items-center gap-2 w-full py-1 px-2 hover:bg-white/5 rounded text-left"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-text-secondary-dark" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-text-secondary-dark" />
                )}
                <Folder className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-white">{folderName}</span>
              </button>
              {isExpanded && renderTree(node[folderName], folderPath, depth + 1)}
            </div>
          );
        })}

        {files.map(filePath => {
          const fileName = filePath.split('/').pop();
          const selected = isFileSelected(filePath);

          return (
            <label
              key={filePath}
              className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer transition-colors ${
                selected ? 'bg-primary/10' : 'hover:bg-white/5'
              }`}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggleFile(filePath)}
                className="w-4 h-4 rounded bg-bg-dark border-white/20 text-primary focus:ring-primary"
              />
              <File className="w-4 h-4 text-text-secondary-dark" />
              <span className={`text-sm ${selected ? 'text-white' : 'text-text-secondary-dark'}`}>
                {fileName}
              </span>
            </label>
          );
        })}
      </div>
    );
  };

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      {/* Header with shared toggle */}
      <div className="p-4 bg-white/5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-white">Per-Card File Selection</h4>
            <p className="text-xs text-text-secondary-dark mt-1">
              Select different files for each output type
            </p>
          </div>
          <button
            onClick={() => onToggleSharedFiles(!useSharedFiles)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
              useSharedFiles
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-white/5 text-text-secondary-dark border border-white/10 hover:border-white/20'
            }`}
          >
            {useSharedFiles ? (
              <>
                <Link2 className="w-4 h-4" />
                <span>Shared</span>
              </>
            ) : (
              <>
                <Link2Off className="w-4 h-4" />
                <span>Per-Card</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Card tabs */}
      <div className="flex border-b border-white/10">
        {CARDS.map(card => {
          const colors = COLOR_CLASSES[card.color];
          const isActive = activeCard === card.id;
          const fileCount = (cardFiles[card.id] || []).length;
          const Icon = card.icon;

          return (
            <button
              key={card.id}
              onClick={() => setActiveCard(card.id)}
              disabled={useSharedFiles}
              className={`flex-1 p-3 transition-all ${
                isActive && !useSharedFiles
                  ? `${colors.activeBg} border-b-2 ${colors.activeBorder}`
                  : 'hover:bg-white/5 border-b-2 border-transparent'
              } ${useSharedFiles ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-center gap-2">
                <Icon className={`w-4 h-4 ${isActive && !useSharedFiles ? colors.text : 'text-text-secondary-dark'}`} />
                <span className={`text-sm font-medium ${isActive && !useSharedFiles ? 'text-white' : 'text-text-secondary-dark'}`}>
                  {card.name}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  isActive && !useSharedFiles ? colors.bg + ' ' + colors.text : 'bg-white/10 text-text-secondary-dark'
                }`}>
                  {fileCount}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Content area */}
      {useSharedFiles ? (
        <div className="p-6 text-center">
          <Link2 className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-white font-medium mb-1">Using Shared File Selection</p>
          <p className="text-sm text-text-secondary-dark mb-4">
            All cards will use the same {selectedFiles.length} files selected in the Input tab
          </p>
          <button
            onClick={() => onToggleSharedFiles(false)}
            className="px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm hover:bg-primary/30 transition-colors"
          >
            Enable Per-Card Selection
          </button>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="p-3 bg-white/5 border-b border-white/10 flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary-dark" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter files..."
                className="w-full pl-9 pr-3 py-1.5 bg-bg-dark border border-white/10 rounded-lg text-sm text-white
                         placeholder:text-text-secondary-dark focus:outline-none focus:border-primary/50"
              />
            </div>

            {/* Quick select patterns */}
            <div className="flex items-center gap-1">
              <Filter className="w-4 h-4 text-text-secondary-dark mr-1" />
              {Object.entries(QUICK_PATTERNS).map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => selectByPattern(key)}
                  className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 text-text-secondary-dark
                           hover:text-white rounded transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={selectAll}
                className="px-2 py-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors"
              >
                Select All
              </button>
              <button
                onClick={clearAll}
                className="px-2 py-1 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* File tree */}
          <div className="p-3 max-h-64 overflow-y-auto">
            {filteredFiles.length === 0 ? (
              <div className="text-center py-6 text-text-secondary-dark">
                <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No files available</p>
                <p className="text-xs mt-1">Select files in the Input tab first</p>
              </div>
            ) : (
              renderTree(folderStructure)
            )}
          </div>

          {/* Footer with summary */}
          <div className="p-3 bg-white/5 border-t border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary-dark">
                {currentCardFiles.length} of {selectedFiles.length} files selected for{' '}
                <span className="text-white">{CARDS.find(c => c.id === activeCard)?.name}</span>
              </span>
              {!useSharedFiles && (
                <div className="flex gap-4">
                  {CARDS.map(card => {
                    const colors = COLOR_CLASSES[card.color];
                    const count = (cardFiles[card.id] || []).length;
                    return (
                      <span key={card.id} className={colors.text}>
                        {card.name.split(' ')[0]}: {count}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
