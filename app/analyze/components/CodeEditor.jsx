'use client';

/**
 * Code Editor Component
 *
 * Monaco Editor wrapper for code preview and editing.
 * Provides VS Code-like experience with syntax highlighting.
 *
 * Features:
 * - Syntax highlighting for 50+ languages
 * - Dark theme (vs-dark) matching ORIZON design
 * - Read-only preview mode
 * - Optional edit mode
 * - Language auto-detection
 * - Line numbers
 * - Minimap toggle
 * - Word wrap option
 */

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Copy, Check, Maximize2, Minimize2, FileCode } from 'lucide-react';

// Dynamic import to avoid SSR issues with Monaco
const Editor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-bg-dark">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    ),
  }
);

// Language detection from file extension
const detectLanguage = (filename) => {
  if (!filename) return 'plaintext';

  const ext = filename.split('.').pop()?.toLowerCase();

  const languageMap = {
    // JavaScript/TypeScript
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    mjs: 'javascript',
    cjs: 'javascript',

    // Python
    py: 'python',
    pyw: 'python',
    pyi: 'python',

    // Java/JVM
    java: 'java',
    kt: 'kotlin',
    kts: 'kotlin',
    scala: 'scala',
    groovy: 'groovy',

    // C-family
    c: 'c',
    h: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    hpp: 'cpp',
    cs: 'csharp',

    // Web
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'scss',
    less: 'less',

    // Data formats
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    toml: 'ini',

    // Shell
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    fish: 'shell',
    ps1: 'powershell',

    // Other languages
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    r: 'r',
    sql: 'sql',
    md: 'markdown',
    graphql: 'graphql',
    dockerfile: 'dockerfile',

    // Config
    env: 'ini',
    ini: 'ini',
    conf: 'ini',
  };

  // Handle special filenames
  const filenameMap = {
    dockerfile: 'dockerfile',
    makefile: 'makefile',
    gemfile: 'ruby',
    rakefile: 'ruby',
    '.gitignore': 'ini',
    '.env': 'ini',
    '.env.local': 'ini',
  };

  const lowerFilename = filename.toLowerCase();
  if (filenameMap[lowerFilename]) {
    return filenameMap[lowerFilename];
  }

  return languageMap[ext] || 'plaintext';
};

export default function CodeEditor({
  value = '',
  onChange,
  filename = '',
  language,
  readOnly = true,
  height = '400px',
  showMinimap = false,
  showLineNumbers = true,
  wordWrap = 'on',
  className = '',
}) {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Determine language
  const editorLanguage = language || detectLanguage(filename);

  // Handle copy
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [value]);

  // Editor options
  const editorOptions = {
    readOnly,
    minimap: { enabled: showMinimap },
    lineNumbers: showLineNumbers ? 'on' : 'off',
    wordWrap,
    scrollBeyondLastLine: false,
    fontSize: 13,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    fontLigatures: true,
    renderLineHighlight: readOnly ? 'none' : 'line',
    cursorStyle: readOnly ? 'line-thin' : 'line',
    cursorBlinking: readOnly ? 'solid' : 'blink',
    smoothScrolling: true,
    padding: { top: 12, bottom: 12 },
    automaticLayout: true,
    tabSize: 2,
    formatOnPaste: true,
    bracketPairColorization: { enabled: true },
    guides: {
      indentation: true,
      bracketPairs: true,
    },
  };

  // Fullscreen styles
  const containerStyles = isFullscreen
    ? 'fixed inset-0 z-50 bg-bg-dark'
    : `relative ${className}`;

  const editorHeight = isFullscreen ? '100vh' : height;

  return (
    <div className={containerStyles}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-dark border-b border-white/10">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-text-secondary-dark" />
          {filename && (
            <span className="text-sm text-white font-mono truncate max-w-[200px]">
              {filename}
            </span>
          )}
          <span className="px-1.5 py-0.5 text-xs bg-white/5 text-text-secondary-dark rounded">
            {editorLanguage}
          </span>
          {readOnly && (
            <span className="px-1.5 py-0.5 text-xs bg-amber-500/10 text-amber-400 rounded">
              Read Only
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-white/5 rounded transition-colors"
            title="Copy code"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-text-secondary-dark" />
            )}
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 hover:bg-white/5 rounded transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-text-secondary-dark" />
            ) : (
              <Maximize2 className="w-4 h-4 text-text-secondary-dark" />
            )}
          </button>
        </div>
      </div>

      {/* Editor */}
      <Editor
        height={editorHeight}
        language={editorLanguage}
        value={value}
        onChange={onChange}
        theme="vs-dark"
        options={editorOptions}
        loading={
          <div className="flex items-center justify-center h-full bg-bg-dark">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        }
      />
    </div>
  );
}

/**
 * Multi-file code viewer
 * Shows multiple files with tabs
 */
export function MultiFileEditor({
  files = [], // Array of { path, content, language? }
  activeFile = 0,
  onActiveFileChange,
  readOnly = true,
  height = '400px',
}) {
  const [activeIndex, setActiveIndex] = useState(activeFile);

  const handleTabClick = (index) => {
    setActiveIndex(index);
    onActiveFileChange?.(index);
  };

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-surface-dark rounded-xl border border-white/10">
        <div className="text-center">
          <FileCode className="w-8 h-8 text-text-secondary-dark mx-auto mb-2" />
          <p className="text-sm text-text-secondary-dark">No files selected</p>
        </div>
      </div>
    );
  }

  const currentFile = files[activeIndex] || files[0];

  return (
    <div className="bg-surface-dark rounded-xl overflow-hidden border border-white/10">
      {/* File Tabs */}
      {files.length > 1 && (
        <div className="flex items-center gap-1 px-2 py-1 bg-bg-dark border-b border-white/10 overflow-x-auto">
          {files.map((file, index) => (
            <button
              key={file.path || index}
              onClick={() => handleTabClick(index)}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors whitespace-nowrap ${
                index === activeIndex
                  ? 'bg-surface-dark text-white'
                  : 'text-text-secondary-dark hover:bg-white/5 hover:text-white'
              }`}
            >
              {file.path?.split('/').pop() || `File ${index + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Editor */}
      <CodeEditor
        value={currentFile.content || ''}
        filename={currentFile.path}
        language={currentFile.language}
        readOnly={readOnly}
        height={height}
        showMinimap={files.length === 1}
      />
    </div>
  );
}
