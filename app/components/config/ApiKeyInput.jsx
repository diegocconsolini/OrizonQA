import { AlertCircle, Server, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import useLMStudio from '../../hooks/useLMStudio';

export default function ApiKeyInput({
  provider,
  setProvider,
  apiKey,
  setApiKey,
  lmStudioUrl,
  setLmStudioUrl,
  selectedModel,
  setSelectedModel,
  model
}) {
  const {
    testing,
    testStatus,
    testMessage,
    availableModels,
    loadingModels,
    testConnection,
    fetchModels,
    testPrompt
  } = useLMStudio();

  // Fetch models when LM Studio URL changes
  useEffect(() => {
    if (provider === 'lmstudio' && lmStudioUrl) {
      fetchModels(lmStudioUrl);
    }
  }, [provider, lmStudioUrl]);

  const handleTestConnection = async () => {
    await testConnection(lmStudioUrl);
  };

  const handleTestPrompt = async () => {
    await testPrompt(lmStudioUrl, selectedModel);
  };

  return (
    <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-5 md:p-6 mb-6">
      <h3 className="font-semibold mb-4 text-white">AI Provider Configuration</h3>

      {/* Provider Selection */}
      <div className="mb-4">
        <label className="block text-sm text-slate-400 mb-2 font-medium">AI Provider</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setProvider('claude')}
            className={`p-3 rounded-xl border-2 transition-all ${
              provider === 'claude'
                ? 'border-indigo-500 bg-indigo-500/10 text-white'
                : 'border-slate-700/50 bg-slate-900/50 text-slate-400 hover:border-slate-600'
            }`}
          >
            <div className="font-medium text-sm">Claude AI</div>
            <div className="text-xs text-slate-500 mt-1">Anthropic API</div>
          </button>
          <button
            onClick={() => setProvider('lmstudio')}
            className={`p-3 rounded-xl border-2 transition-all ${
              provider === 'lmstudio'
                ? 'border-indigo-500 bg-indigo-500/10 text-white'
                : 'border-slate-700/50 bg-slate-900/50 text-slate-400 hover:border-slate-600'
            }`}
          >
            <div className="font-medium text-sm flex items-center gap-2">
              <Server size={14} />
              LM Studio
            </div>
            <div className="text-xs text-slate-500 mt-1">Local LLM</div>
          </button>
        </div>
      </div>

      {/* Claude API Key */}
      {provider === 'claude' && (
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
              value={model}
              disabled
              className="w-full bg-slate-900/50 border border-slate-700/30 rounded-xl p-3 text-sm text-slate-500"
            />
          </div>
        </div>
      )}

      {/* LM Studio Configuration */}
      {provider === 'lmstudio' && (
        <div className="space-y-4">
          {/* URL Input */}
          <div>
            <label className="block text-sm text-slate-400 mb-2 font-medium">LM Studio URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={lmStudioUrl}
                onChange={(e) => setLmStudioUrl(e.target.value)}
                placeholder="http://192.168.2.101:1234"
                className="flex-1 bg-slate-900/70 border border-slate-700/50 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              <button
                onClick={handleTestConnection}
                disabled={testing || !lmStudioUrl}
                className="px-4 py-3 bg-slate-700/70 hover:bg-slate-600/70 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-slate-200 transition-all flex items-center gap-2"
              >
                {testing ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <RefreshCw size={16} />
                )}
                Test
              </button>
            </div>
          </div>

          {/* Test Status */}
          {testStatus && (
            <div className={`p-3 rounded-xl border ${
              testStatus === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-start gap-2">
                {testStatus === 'success' ? (
                  <CheckCircle className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
                ) : (
                  <XCircle className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
                )}
                <span className={`text-sm ${
                  testStatus === 'success' ? 'text-emerald-200' : 'text-red-200'
                }`}>
                  {testMessage}
                </span>
              </div>
            </div>
          )}

          {/* Model Selection */}
          {availableModels.length > 0 && (
            <div>
              <label className="block text-sm text-slate-400 mb-2 font-medium">
                Active Model {loadingModels && <Loader2 className="inline animate-spin ml-2" size={12} />}
              </label>
              <select
                value={selectedModel || ''}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-slate-900/70 border border-slate-700/50 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
              >
                <option value="">Auto-detect</option>
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.id}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-2">
                {availableModels.length} model(s) available
              </p>
            </div>
          )}

          {/* Test Prompt Button */}
          {availableModels.length > 0 && (
            <div>
              <button
                onClick={handleTestPrompt}
                disabled={testing}
                className="w-full px-4 py-3 bg-indigo-600/20 hover:bg-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-indigo-300 transition-all flex items-center justify-center gap-2 border border-indigo-500/30"
              >
                {testing ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Testing...
                  </>
                ) : (
                  <>
                    <Server size={16} />
                    Test with Sample Prompt
                  </>
                )}
              </button>
            </div>
          )}

          {/* Connection Info */}
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Server size={12} />
            Make sure LM Studio is running with a model loaded
          </p>
        </div>
      )}

      {/* Info message */}
      <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
        <AlertCircle size={12} />
        {provider === 'claude'
          ? 'Your API key is sent directly to Anthropic\'s API and is not stored anywhere.'
          : 'Connects to your local LM Studio instance. No data leaves your network.'
        }
      </p>
    </div>
  );
}
