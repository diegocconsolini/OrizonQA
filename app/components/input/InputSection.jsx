import { Upload, AlertCircle, Loader2, Github, FileText, Zap } from 'lucide-react';
import Tab from '../shared/Tab';
import FileTree from './FileTree';

export default function InputSection({
  inputTab,
  setInputTab,
  codeInput,
  setCodeInput,
  githubUrl,
  setGithubUrl,
  githubBranch,
  setGithubBranch,
  githubToken,
  setGithubToken,
  fetchGitHub,
  uploadedFiles,
  setUploadedFiles,
  isDragging,
  setIsDragging,
  handleDrop,
  handleFileSelect,
  loading,
  estimatedTokens,
  isTruncated,
  availableBranches,
  fetchingBranches
}) {
  return (
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
            <div>
              <label className="block text-sm text-slate-400 mb-2 font-medium">
                GitHub Token <span className="text-slate-600">(optional, for private repos)</span>
              </label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_..."
                className="w-full bg-slate-900/70 border border-slate-700/50 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm text-slate-400 mb-2 font-medium">
                  Branch {fetchingBranches && <Loader2 className="inline animate-spin ml-2" size={12} />}
                </label>
                {availableBranches.length > 0 ? (
                  <select
                    value={githubBranch}
                    onChange={(e) => setGithubBranch(e.target.value)}
                    className="w-full bg-slate-900/70 border border-slate-700/50 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                  >
                    {availableBranches.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={githubBranch}
                    onChange={(e) => setGithubBranch(e.target.value)}
                    placeholder="main"
                    className="w-full bg-slate-900/70 border border-slate-700/50 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                )}
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
              Use a GitHub Personal Access Token to fetch private repositories
            </p>

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
  );
}
