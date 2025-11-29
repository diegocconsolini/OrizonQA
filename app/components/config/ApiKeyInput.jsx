import { AlertCircle } from 'lucide-react';

export default function ApiKeyInput({ apiKey, setApiKey, model }) {
  return (
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
            value={model}
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
  );
}
