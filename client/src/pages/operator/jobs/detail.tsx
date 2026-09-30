import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Tractor,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Play,
  CheckCircle,
  Radio,
} from 'lucide-react';
import { api } from '../../../services/api.js';
import { useI18n } from '../../../i18n/index.js';
import { StatusBadge } from '../../../components/StatusBadge.js';
import { LoadingSpinner } from '../../../components/LoadingSpinner.js';
import { SuccessToast } from '../../../components/SuccessToast.js';

export const OperatorJobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['operatorBooking', id],
    queryFn: () => api.bookings.getById(id!),
    enabled: !!id,
  });

  const updateTaskMutation = useMutation({
    mutationFn: (status: string) => api.operator.updateTask(id!, { status }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['operatorBooking', id] });
      queryClient.invalidateQueries({ queryKey: ['operatorTasks'] });
      queryClient.invalidateQueries({ queryKey: ['operatorActiveJob'] });
      setToastMessage(`Job status updated to ${updated.status}`);
    },
  });

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading job instructions..." />;
  }

  if (!booking) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-bold text-slate-800">Job assignment not found</h2>
        <Link to="/operator/dashboard" className="text-sm font-semibold text-farm-600 mt-2 inline-block">
          &larr; Back to dashboard
        </Link>
      </div>
    );
  }

  const isAssigned = booking.status === 'ASSIGNED' || booking.status === 'APPROVED';
  const isInProgress = booking.status === 'IN_PROGRESS';
  const isCompleted = booking.status === 'COMPLETED';

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {toastMessage && (
        <SuccessToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}

      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/operator/dashboard')}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Task #{booking.id}
            </h1>
            <StatusBadge status={booking.status} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Assigned Machine: {booking.machine?.name}
          </p>
        </div>
      </div>

      {/* Main Details */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        {/* Machinery Specs */}
        <div className="p-5 bg-gradient-to-br from-orange-50/70 to-farm-50/40 rounded-2xl border border-orange-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-orange-500 text-white rounded-2xl shadow-md shadow-orange-500/20">
              <Tractor className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">{booking.machine?.name}</h2>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                Target Area: {booking.areaInAcres} Acres • Crop: {booking.cropType || 'Wheat'}
              </p>
            </div>
          </div>
        </div>

        {/* Farmer Info & Call */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Client Farmer & Field Details
          </h3>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-slate-900">{booking.farmer?.name}</span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  Village: {booking.locationVillage} {booking.locationField ? `(${booking.locationField})` : ''}
                </span>
                {booking.locationLandmark && (
                  <span className="text-xs text-slate-500 block">Landmark: {booking.locationLandmark}</span>
                )}
              </div>

              {booking.farmer?.phone && (
                <a
                  href={`tel:${booking.farmer.phone}`}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5 text-farm-600" />
                  <span>Call ({booking.farmer.phone})</span>
                </a>
              )}
            </div>

            {booking.specialInstructions && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 italic">
                Special Instructions: "{booking.specialInstructions}"
              </div>
            )}
          </div>
        </div>

        {/* Action Controls for Operator */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {isAssigned && (
              <button
                type="button"
                onClick={() => updateTaskMutation.mutate('IN_PROGRESS')}
                disabled={updateTaskMutation.isPending}
                className="w-full sm:flex-1 py-3.5 px-4 rounded-xl bg-farm-600 hover:bg-farm-700 text-white font-black text-sm shadow-lg shadow-farm-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-105"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{t('operator.actions.startJob')}</span>
              </button>
            )}

            {isInProgress && (
              <>
                <button
                  type="button"
                  onClick={() => updateTaskMutation.mutate('COMPLETED')}
                  disabled={updateTaskMutation.isPending}
                  className="w-full sm:flex-1 py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-sm shadow-lg flex items-center justify-center space-x-2 transition-all"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>{t('operator.actions.completeJob')}</span>
                </button>

                <Link
                  to="/operator/tracking"
                  className="w-full sm:w-auto py-3.5 px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-lg shadow-orange-600/25 flex items-center justify-center space-x-2"
                >
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span>Stream GPS Location</span>
                </Link>
              </>
            )}

            {isCompleted && (
              <div className="w-full p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold text-center flex items-center justify-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>This job was completed and logged into Custom Hiring Centre records.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
