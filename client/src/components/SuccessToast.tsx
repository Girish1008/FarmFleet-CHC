import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface SuccessToastProps {
  message: string;
  onDismiss?: () => void;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-r-lg shadow-sm flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <p className="text-sm font-semibold text-emerald-900">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-emerald-500 hover:text-emerald-800 transition-colors p-1"
          aria-label="Dismiss message"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
