import React from 'react';
import { BookingStatus, RequestStatus } from '../types/index.js';
import { useI18n } from '../i18n/index.js';

interface StatusBadgeProps {
  status: BookingStatus | RequestStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const { t } = useI18n();

  const getStyle = (s: string) => {
    switch (s) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'ASSIGNED':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      case 'IN_PROGRESS':
        return 'bg-emerald-100 text-emerald-950 border-emerald-400 font-bold';
      case 'COMPLETED':
        return 'bg-green-100 text-green-900 border-green-300';
      case 'CANCELLED':
        return 'bg-slate-200 text-slate-700 border-slate-300';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const isLive = status === 'IN_PROGRESS';
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs sm:text-sm';

  const translationKey = `status.${status}` as any;
  const label = t(translationKey, status);

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rounded-full border font-semibold tracking-wide ${sizeClasses} ${getStyle(
        status
      )}`}
    >
      {isLive && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
        </span>
      )}
      <span>{label}</span>
    </span>
  );
};
