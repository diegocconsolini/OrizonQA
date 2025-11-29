import { AlertCircle, Server } from 'lucide-react';

export default function ApiKeyInput({
  provider,
  setProvider,
  apiKey,
  setApiKey,
  lmStudioUrl,
  setLmStudioUrl,
  model
}) {
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

      {/* LM Studio URL */}
      {provider === 'lmstudio' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2 font-medium">LM Studio URL</label>
            <input
              type="text"
              value={lmStudioUrl}
              onChange={(e) => setLmStudioUrl(e.target.value)}
              placeholder="http://192.168.2.101:1234"
              className="w-full bg-slate-900/70 border border-slate-700/50 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
              <Server size={12} />
              Make sure LM Studio is running and CORS is enabled
            </p>
          </div>
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
