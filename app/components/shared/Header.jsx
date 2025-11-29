import { Code, HelpCircle } from 'lucide-react';

export default function Header({ onHelpClick }) {
  return (
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
        onClick={onHelpClick}
        className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white"
      >
        <HelpCircle size={20} />
      </button>
    </div>
  );
}
