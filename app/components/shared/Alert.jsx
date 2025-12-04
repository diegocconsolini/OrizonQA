import { AlertCircle, Check, AlertTriangle, X } from 'lucide-react';

export default function Alert({ type, message, onDismiss }) {
  const baseClasses = "mb-6 p-4 rounded-xl flex items-start gap-3 fade-in";

  const renderDismiss = () => onDismiss && (
    <button
      onClick={onDismiss}
      className="ml-auto p-1 hover:bg-white/10 rounded transition-colors"
      aria-label="Dismiss"
    >
      <X size={16} className="opacity-60 hover:opacity-100" />
    </button>
  );

  if (type === 'error') {
    return (
      <div className={`${baseClasses} bg-red-500/10 border border-red-500/30`}>
        <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
        <span className="text-red-200 text-sm flex-1">{message}</span>
        {renderDismiss()}
      </div>
    );
  }

  if (type === 'success') {
    return (
      <div className={`${baseClasses} bg-emerald-500/10 border border-emerald-500/30 items-center`}>
        <Check className="text-emerald-400" size={18} />
        <span className="text-emerald-200 text-sm flex-1">{message}</span>
        {renderDismiss()}
      </div>
    );
  }

  if (type === 'warning') {
    return (
      <div className={`${baseClasses} bg-amber-500/10 border border-amber-500/30`}>
        <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
        <span className="text-amber-200 text-sm flex-1">{message}</span>
        {renderDismiss()}
      </div>
    );
  }

  if (type === 'info') {
    return (
      <div className={`${baseClasses} bg-blue-500/10 border border-blue-500/30`}>
        <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />
        <span className="text-blue-200 text-sm flex-1">{message}</span>
        {renderDismiss()}
      </div>
    );
  }

  return null;
}
