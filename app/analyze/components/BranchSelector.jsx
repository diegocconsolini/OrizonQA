'use client';

/**
 * Branch Selector Component
 *
 * Dropdown to select which branch to analyze from a repository.
 * Shows current branch and allows switching.
 */

import { useState, useRef, useEffect } from 'react';
import { GitBranch, ChevronDown, Check } from 'lucide-react';

export default function BranchSelector({
  branches = [],
  selectedBranch = 'main',
  onChangeBranch,
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (branch) => {
    onChangeBranch?.(branch);
    setIsOpen(false);
  };

  if (branches.length === 0) {
    return null;
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-2 bg-bg-dark border border-white/10 rounded-lg
                  text-sm transition-all duration-200 min-w-[140px]
                  ${disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-white/5 hover:border-white/20'
                  }`}
      >
        <GitBranch className="w-4 h-4 text-text-secondary-dark" />
        <span className="text-white truncate flex-1 text-left">
          {selectedBranch}
        </span>
        <ChevronDown className={`w-4 h-4 text-text-secondary-dark transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[180px] bg-surface-dark border border-white/10
                      rounded-lg shadow-xl overflow-hidden">
          <div className="max-h-[200px] overflow-y-auto">
            {branches.map((branch) => (
              <button
                key={branch}
                onClick={() => handleSelect(branch)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                          transition-colors duration-150 ${
                  branch === selectedBranch
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary-dark hover:bg-white/5 hover:text-white'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate flex-1">{branch}</span>
                {branch === selectedBranch && (
                  <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
