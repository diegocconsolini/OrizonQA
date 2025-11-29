'use client';

import { useState, useCallback } from 'react';
import { 
  Upload, Copy, Download, Check, AlertCircle, Loader2, 
  Github, FileText, Code, HelpCircle, ChevronDown, 
  ChevronRight, X, File, Folder, Sparkles, Zap
} from 'lucide-react';
import JSZip from 'jszip';

// Tab component
function Tab({ active, onClick, children, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm rounded-lg transition-all duration-200 ${
        active 
          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25' 
          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
      }`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

// File tree component
function FileTree({ files }) {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (path) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const buildTree = (files) => {
    const tree = {};
    files.forEach(file => {
      const parts = file.name.split('/');
      let current = tree;
      parts.forEach((part, i) => {
        if (!current[part]) {
          current[part] = i === parts.length - 1 ? { _isFile: true, content: file.content } : {};
        }
        current = current[part];
      });
    });
    return tree;
  };

  const renderTree = (node, path = '', level = 0) => {
    return Object.entries(node).filter(([key]) => key !== '_isFile' && key !== 'content').map(([key, value]) => {
      const fullPath = path ? `${path}/${key}` : key;
      const isFile = value._isFile;
      const isExpanded = expanded[fullPath];

      return (
        <div key={fullPath} style={{ marginLeft: level * 16 }}>
          <div 
            className={`flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-slate-700/50 cursor-pointer text-sm transition-colors ${isFile ? 'text-slate-300' : 'text-slate-200'}`}
            onClick={() => !isFile && toggleExpand(fullPath)}
          >
            {isFile ? (
              <File size={14} className="text-indigo-400" />
            ) : (
              <>
                {isExpanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                <Folder size={14} className="text-amber-400" />
              </>
            )}
            <span className="truncate">{key}</span>
          </div>
          {!isFile && isExpanded && renderTree(value, fullPath, level + 1)}
        </div>
      );
    });
  };

  const tree = buildTree(files);
  return <div className="mt-3 max-h-48 overflow-y-auto rounded-lg bg-slate-900/50 p-2">{renderTree(tree)}</div>;
}

// Main component
export default function Home() {
  // Input states
  const [inputTab, setInputTab] = useState('paste');
  const [codeInput, setCodeInput] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Config states
  const [config, setConfig] = useState({
    userStories: true,
    testCases: true,
    acceptanceCriteria: true,
    edgeCases: false,
    securityTests: false,
    outputFormat: 'markdown',
    testFramework: 'generic',
    additionalContext: ''
  });

  // API states
  const [apiKey, setApiKey] = useState('');
  const [model] = useState('claude-sonnet-4-20250514');

  // Output states
  const [outputTab, setOutputTab] = useState('stories');
  const [results, setResults] = useState({ userStories: '', testCases: '', acceptanceCriteria: '', raw: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenUsage, setTokenUsage] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Calculate token estimate
  const getInputContent = useCallback(() => {
    if (inputTab === 'paste') return codeInput;
    if (inputTab === 'upload' || uploadedFiles.length > 0) {
      return uploadedFiles.map(f => `=== FILE: ${f.name} ===\n${f.content}`).join('\n\n');
    }
    return '';
  }, [inputTab, codeInput, uploadedFiles]);

  const estimatedTokens = Math.ceil(getInputContent().length / 4);
  const isTruncated = getInputContent().length > 100000;

  // File handling
  const acceptedTypes = ['.zip', '.txt', '.md', '.json', '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.cs', '.go', '.rb', '.html', '.css', '.sql', '.yml', '.yaml', '.xml', '.sh', '.env'];

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  }, []);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    await processFiles(files);
  };

  const processFiles = async (files) => {
    const processed = [];
    setError('');
    
    for (const file of files) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      
      if (file.name.endsWith('.zip')) {
        try {
          const zip = await JSZip.loadAsync(file);
          
          for (const [path, zipEntry] of Object.entries(zip.files)) {
            if (zipEntry.dir) continue;
            if (path.includes('node_modules/') || path.includes('.git/') || path.includes('__pycache__/')) continue;
            
            const fileExt = '.' + path.split('.').pop().toLowerCase();
            if (acceptedTypes.includes(fileExt) || path.endsWith('Dockerfile') || path.endsWith('Makefile')) {
              try {
                const content = await zipEntry.async('string');
                if (content.length < 500000) { // Skip very large files
                  processed.push({ name: path, content });
                }
              } catch {
                // Skip binary files
              }
            }
          }
        } catch (err) {
          setError('Failed to process zip file: ' + err.message);
        }
      } else if (acceptedTypes.includes(ext)) {
        const content = await file.text();
        if (content.length < 500000) {
          processed.push({ name: file.name, content });
        }
      }
    }
    
    setUploadedFiles(prev => [...prev, ...processed]);
    if (processed.length > 0) {
      setSuccess(`Loaded ${processed.length} file(s)`);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  // GitHub fetching
  const fetchGitHub = async () => {
    const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/\?]+)/);
    if (!match) {
      setError('Invalid GitHub URL format. Use: https://github.com/owner/repo');
      return;
    }

    const [, owner, repo] = match;
    const cleanRepo = repo.replace('.git', '');
    setLoading(true);
    setError('');

    try {
      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/git/trees/${githubBranch}?recursive=1`);
      if (!treeRes.ok) {
        if (treeRes.status === 404) {
          throw new Error('Repository or branch not found. Make sure it\'s a public repository.');
        }
        throw new Error('Failed to fetch repository');
      }
      
      const tree = await treeRes.json();
      const files = tree.tree
        .filter(item => item.type === 'blob')
        .filter(item => !item.path.includes('node_modules/') && !item.path.includes('.git/') && !item.path.includes('__pycache__/'))
        .filter(item => acceptedTypes.some(ext => item.path.endsWith(ext)) || item.path.endsWith('Dockerfile') || item.path.endsWith('Makefile'))
        .slice(0, 50);

      const contents = await Promise.all(
        files.map(async (file) => {
          try {
            const res = await fetch(`https://raw.githubusercontent.com/${owner}/${cleanRepo}/${githubBranch}/${file.path}`);
            if (!res.ok) return null;
            const content = await res.text();
            if (content.length > 500000) return null;
            return { name: file.path, content };
          } catch {
            return null;
          }
        })
      );

      const validContents = contents.filter(Boolean);
      setUploadedFiles(validContents);
      setInputTab('upload');
      setSuccess(`Fetched ${validContents.length} files from repository`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // API call through our Next.js route
  const analyzeCodebase = async () => {
    if (!apiKey) {
      setError('Please enter your Claude API key');
      return;
    }

    const content = getInputContent();
    if (!content.trim()) {
      setError('Please provide code to analyze');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setResults({ userStories: '', testCases: '', acceptanceCriteria: '', raw: null });

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          content,
          config: { ...config, model }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResults({
        userStories: data.userStories || '',
        testCases: data.testCases || '',
        acceptanceCriteria: data.acceptanceCriteria || '',
        raw: data.raw
      });
      
      setTokenUsage({
        input: data.usage?.input_tokens || 0,
        output: data.usage?.output_tokens || 0
      });
      
      setSuccess('Analysis complete!');
      setOutputTab('stories');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Copy and download handlers
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (content, filename, type = 'text/markdown') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCurrentOutput = () => {
    switch (outputTab) {
      case 'stories': return results.userStories;
      case 'tests': return results.testCases;
      case 'criteria': return results.acceptanceCriteria;
      case 'raw': return JSON.stringify(results.raw, null, 2);
      default: return '';
    }
  };

  const clearAll = () => {
    setCodeInput('');
    setUploadedFiles([]);
    setGithubUrl('');
    setResults({ userStories: '', testCases: '', acceptanceCriteria: '', raw: null });
    setError('');
    setSuccess('');
    setTokenUsage(null);
  };

  const canAnalyze = apiKey && (codeInput.trim() || uploadedFiles.length > 0);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
              <Code className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Codebase QA Analyzer
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">Generate user stories & test cases from code</p>
            </div>
          </div>
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white"
          >
            <HelpCircle size={20} />
          </button>
        </div>

        {/* Help Modal */}
        {showHelp && (
          <div className="mb-6 p-5 bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 fade-in">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                How to Use
              </h3>
              <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
              <li>Paste your code, fetch from a public GitHub repo, or upload files</li>
              <li>Select what to generate (user stories, test cases, acceptance criteria)</li>
              <li>Enter your Claude API key (get one at <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">console.anthropic.com</a>)</li>
              <li>Click "Analyze Codebase" and wait for the magic ✨</li>
              <li>Copy or download the generated QA artifacts</li>
            </ol>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 fade-in">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
            <span className="text-red-200 text-sm">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 fade-in">
            <Check className="text-emerald-400" size={18} />
            <span className="text-emerald-200 text-sm">{success}</span>
          </div>
        )}

        {/* Input Section */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 mb-6 overflow-hidden">
          <div className="flex gap-2 p-3 border-b border-slate-700/50 bg-slate-800/30">
            <Tab active={inputTab === 'paste'} onClick={() => setInputTab('paste')} icon={FileText}>
              Paste Code
            </Tab>
            <Tab active={inputTab === 'github'} onClick={() => setInputTab('github')} icon={Github}>
              GitHub
            </Tab>
            <Tab active={inputTab === 'upload'} onClick={() => setInputTab('upload')} icon={Upload}>
              Upload
            </Tab>
          </div>

          <div className="p-4 md:p-5">
            {inputTab === 'paste' && (
              <textarea
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Paste your code or multiple files here...

You can paste multiple files with separators like:
=== FILE: example.py ===
def hello():
    print('Hello!')

=== FILE: utils.py ===
def helper():
    pass"
                className="w-full h-72 md:h-80 bg-slate-900/70 border border-slate-700/50 rounded-xl p-4 text-sm font-mono text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            )}

            {inputTab === 'github' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2 font-medium">Repository URL</label>
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                    className="w-full bg-slate-900/70 border border-slate-700/50 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-sm text-slate-400 mb-2 font-medium">Branch</label>
                    <input
                      type="text"
                      value={githubBranch}
                      onChange={(e) => setGithubBranch(e.target.value)}
                      className="w-full bg-slate-900/70 border border-slate-700/50 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                  <button
                    onClick={fetchGitHub}
                    disabled={!githubUrl || loading}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed rounded-xl font-semibold text-white shadow-lg shadow-indigo-500/25 disabled:shadow-none transition-all"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Fetch'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <AlertCircle size={12} />
                  Only public repositories are supported (max 50 files)
                </p>
              </div>
            )}

            {inputTab === 'upload' && (
              <div>
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  className={`border-2 border-dashed rounded-xl p-8 md:p-10 text-center transition-all duration-200 ${
                    isDragging 
                      ? 'border-indigo-500 bg-indigo-500/10' 
                      : 'border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/30'
                  }`}
                >
                  <div className={`mx-auto mb-4 p-4 rounded-2xl inline-block transition-colors ${isDragging ? 'bg-indigo-500/20' : 'bg-slate-800/50'}`}>
                    <Upload className={`${isDragging ? 'text-indigo-400' : 'text-slate-400'}`} size={32} />
                  </div>
                  <p className="text-slate-300 mb-2 font-medium">Drag & drop files here</p>
                  <p className="text-xs text-slate-500 mb-4 max-w-md mx-auto">
                    Accepts: .zip, .txt, .md, .json, .py, .js, .ts, .jsx, .tsx, .java, .cs, .go, .rb, .html, .css
                  </p>
                  <label className="inline-block px-5 py-2.5 bg-slate-700/70 hover:bg-slate-600/70 rounded-xl cursor-pointer transition-colors text-sm font-medium text-slate-200">
                    Browse Files
                    <input type="file" multiple onChange={handleFileSelect} className="hidden" accept=".zip,.txt,.md,.json,.py,.js,.ts,.jsx,.tsx,.java,.cs,.go,.rb,.html,.css,.sql,.yml,.yaml,.xml,.sh" />
                  </label>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-400 font-medium">{uploadedFiles.length} file(s) loaded</span>
                      <button
                        onClick={() => setUploadedFiles([])}
                        className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                      >
                        Clear all
                      </button>
                    </div>
                    <FileTree files={uploadedFiles} />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-5 pb-4 text-sm text-slate-500 flex items-center gap-2">
            <Zap size={14} className="text-amber-500" />
            <span>Estimated tokens: ~{estimatedTokens.toLocaleString()}</span>
            {isTruncated && <span className="text-amber-400 ml-2">(Will be truncated at 100k chars)</span>}
          </div>
        </div>

        {/* Analysis Configuration */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-5 md:p-6 mb-6">
          <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-400" />
            Analysis Options
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              {[
                { key: 'userStories', label: 'Generate User Stories', default: true },
                { key: 'testCases', label: 'Generate Test Cases', default: true },
                { key: 'acceptanceCriteria', label: 'Generate Acceptance Criteria', default: true },
                { key: 'edgeCases', label: 'Include Edge Cases', default: false },
                { key: 'securityTests', label: 'Include Security Test Scenarios', default: false },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={config[item.key]}
                    onChange={(e) => setConfig({...config, [item.key]: e.target.checked})}
                    className="w-5 h-5 rounded-md bg-slate-700 border-slate-600 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-slate-300 group-hover:text-white transition-colors">{item.label}</span>
                </label>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2 font-medium">Output Format</label>
                <select
                  value={config.outputFormat}
                  onChange={(e) => setConfig({...config, outputFormat: e.target.value})}
                  className="w-full bg-slate-900/70 border border-slate-700/50 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                >
                  <option value="markdown">Markdown</option>
                  <option value="json">JSON</option>
                  <option value="jira">Jira Format</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2 font-medium">Test Framework Style</label>
                <select
                  value={config.testFramework}
                  onChange={(e) => setConfig({...config, testFramework: e.target.value})}
                  className="w-full bg-slate-900/70 border border-slate-700/50 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                >
                  <option value="generic">Generic</option>
                  <option value="jest">Jest</option>
                  <option value="pytest">Pytest</option>
                  <option value="junit">JUnit</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-sm text-slate-400 mb-2 font-medium">Additional Context (optional)</label>
            <input
              type="text"
              value={config.additionalContext}
              onChange={(e) => setConfig({...config, additionalContext: e.target.value})}
              placeholder="Describe the project purpose, tech stack, or specific focus areas..."
              className="w-full bg-slate-900/70 border border-slate-700/50 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
        </div>

        {/* API Configuration */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-5 md:p-6 mb-6">
          <h3 className="font-semibold mb-4 text-white">API Configuration</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm text-slate-400 mb-2 font-medium">Claude API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full bg-slate-900/70 border border-slate-700/50 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
            <div className="md:w-52">
              <label className="block text-sm text-slate-400 mb-2 font-medium">Model</label>
              <input
                type="text"
                value="claude-sonnet-4-20250514"
                disabled
                className="w-full bg-slate-900/50 border border-slate-700/30 rounded-xl p-3 text-sm text-slate-500"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
            <AlertCircle size={12} />
            Your API key is sent directly to Anthropic's API and is not stored anywhere.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={analyzeCodebase}
            disabled={!canAnalyze || loading}
            className={`flex-1 py-4 rounded-xl font-semibold text-white shadow-lg transition-all flex items-center justify-center gap-3 ${
              canAnalyze && !loading
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/25 hover:shadow-indigo-500/40'
                : 'bg-slate-700 cursor-not-allowed shadow-none'
            } ${loading ? 'loading-glow' : ''}`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Analyzing your codebase...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                <span>Analyze Codebase</span>
              </>
            )}
          </button>
          <button
            onClick={clearAll}
            className="px-6 py-4 bg-slate-800/70 hover:bg-slate-700/70 rounded-xl font-medium text-slate-300 hover:text-white transition-all border border-slate-700/50"
          >
            Clear All
          </button>
        </div>

        {/* Token Usage */}
        {tokenUsage && (
          <div className="text-sm text-slate-400 text-center mb-6 p-3 bg-slate-800/30 rounded-xl">
            <span className="text-indigo-400 font-medium">{tokenUsage.input.toLocaleString()}</span> input tokens • 
            <span className="text-purple-400 font-medium ml-1">{tokenUsage.output.toLocaleString()}</span> output tokens
          </div>
        )}

        {/* Output Section */}
        {(results.userStories || results.testCases || results.acceptanceCriteria || results.raw) && (
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden fade-in">
            <div className="flex gap-2 p-3 border-b border-slate-700/50 bg-slate-800/30 flex-wrap">
              <Tab active={outputTab === 'stories'} onClick={() => setOutputTab('stories')}>
                User Stories
              </Tab>
              <Tab active={outputTab === 'tests'} onClick={() => setOutputTab('tests')}>
                Test Cases
              </Tab>
              <Tab active={outputTab === 'criteria'} onClick={() => setOutputTab('criteria')}>
                Acceptance Criteria
              </Tab>
              <Tab active={outputTab === 'raw'} onClick={() => setOutputTab('raw')}>
                Raw JSON
              </Tab>
            </div>

            <div className="p-4 md:p-5">
              <div className="bg-slate-900/70 rounded-xl p-4 md:p-5 min-h-64 max-h-[500px] overflow-y-auto border border-slate-700/30">
                <pre className="whitespace-pre-wrap text-sm font-mono text-slate-300 leading-relaxed">
                  {getCurrentOutput() || 'No content generated for this section.'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 pt-0">
              <button
                onClick={() => copyToClipboard(getCurrentOutput())}
                disabled={!getCurrentOutput()}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/70 hover:bg-slate-600/70 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-slate-200 transition-all"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => downloadFile(
                  getCurrentOutput(),
                  `qa-${outputTab}-${Date.now()}.${outputTab === 'raw' ? 'json' : 'md'}`
                )}
                disabled={!getCurrentOutput()}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/70 hover:bg-slate-600/70 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-slate-200 transition-all"
              >
                <Download size={16} />
                Download
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-slate-500">
          Built with Claude AI • Your API key is never stored
        </div>
      </div>
    </div>
  );
}
