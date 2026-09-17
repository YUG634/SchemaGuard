import React from 'react';
import { useAppStore } from '../lib/store';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, setToast } = useAppStore();

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-[#4d8c35] shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-[#d99a2b] shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-[#d94a3d] shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-[#ff6900] shrink-0" />;
    }
  };

  return (
    <div
      id="app-toast"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#14120f] border border-[#3a342c] shadow-[0_12px_32px_rgba(0,0,0,0.7)] text-[13px] text-[#f4f1ec] max-w-md animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      {getIcon()}
      <span className="flex-1 font-sans">{toast.message}</span>
      <button
        type="button"
        onClick={() => setToast(null)}
        className="text-[#6b6660] hover:text-[#f4f1ec] transition-colors p-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
