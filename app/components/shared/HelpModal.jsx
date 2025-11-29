import { Sparkles, X } from 'lucide-react';

export default function HelpModal({ onClose }) {
  return (
    <div className="mb-6 p-5 bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 fade-in">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg text-white flex items-center gap-2">
          <Sparkles size={18} className="text-amber-400" />
          How to Use
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
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
  );
}
