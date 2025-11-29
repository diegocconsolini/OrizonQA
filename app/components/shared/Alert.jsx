import { AlertCircle, Check } from 'lucide-react';

export default function Alert({ type, message }) {
  if (type === 'error') {
    return (
      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 fade-in">
        <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
        <span className="text-red-200 text-sm">{message}</span>
      </div>
    );
  }

  if (type === 'success') {
    return (
      <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 fade-in">
        <Check className="text-emerald-400" size={18} />
        <span className="text-emerald-200 text-sm">{message}</span>
      </div>
    );
  }

  return null;
}
