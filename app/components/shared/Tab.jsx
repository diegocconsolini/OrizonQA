export default function Tab({ active, onClick, children, icon: Icon }) {
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
