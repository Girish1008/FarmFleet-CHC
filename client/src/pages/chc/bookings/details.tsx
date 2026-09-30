import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Tractor,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Radio,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Edit,
} from 'lucide-react';
import { api } from '../../../services/api.js';
import { useI18n } from '../../../i18n/index.js';
import { StatusBadge } from '../../../components/StatusBadge.js';
import { LoadingSpinner } from '../../../components/LoadingSpinner.js';
import { SuccessToast } from '../../../components/SuccessToast.js';
import { ConfirmModal } from '../../../components/ConfirmModal.js';

export const BookingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => api.bookings.getById(id!),
    enabled: !!id,
  });

  const { data: operators } = useQuery({
    queryKey: ['users', 'OPERATOR'],
    queryFn: () => api.users.list({ role: 'OPERATOR' }),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => api.bookings.update(id!, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setToastMessage('Booking updated successfully');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.bookings.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setShowCancelModal(false);
      setToastMessage('Booking cancelled');
    },
  });

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading booking details..." />;
  }

  if (!booking) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-bold text-slate-800">Booking not found</h2>
        <Link to="/chc/bookings" className="text-sm font-semibold text-farm-600 mt-2 inline-block">
          &larr; Back to all bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {toastMessage && (
        <SuccessToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}

      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/chc/bookings')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Booking #{booking.id}
              </h1>
              <StatusBadge status={booking.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Created on {new Date(booking.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Live Tracking Link if in progress */}
        {(booking.status === 'IN_PROGRESS' || booking.status === 'ASSIGNED') && (
          <Link
            to={`/chc/tracking/${booking.id}`}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md shadow-orange-600/20 transition-all hover:scale-105"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>View Live Tracking</span>
          </Link>
        )}
      </div>

      {/* Main Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Farmer Information */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-farm-700 font-bold text-sm border-b border-slate-100 pb-3">
            <User className="w-4 h-4" />
            <span>Farmer & Contact</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-medium">Name:</span>
            <p className="text-base font-bold text-slate-900">{booking.farmer?.name || 'Farmer'}</p>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-medium">Mobile Phone:</span>
            <p className="text-sm font-semibold text-slate-800 flex items-center space-x-2 mt-0.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{booking.farmer?.phone || 'Not provided'}</span>
            </p>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-medium">Location Details:</span>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">
              Village: {booking.locationVillage}
            </p>
            {booking.locationField && (
              <p className="text-xs text-slate-600">Field: {booking.locationField}</p>
            )}
            {booking.locationLandmark && (
              <p className="text-xs text-slate-500">Landmark: {booking.locationLandmark}</p>
            )}
          </div>
        </div>

        {/* Machine & Operator Info */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-farm-700 font-bold text-sm border-b border-slate-100 pb-3">
            <Tractor className="w-4 h-4" />
            <span>Machinery & Assignment</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-medium">Machine Model:</span>
            <p className="text-base font-bold text-slate-900">{booking.machine?.name}</p>
            <span className="text-xs font-semibold text-farm-700 bg-farm-50 px-2 py-0.5 rounded-md inline-block mt-1">
              Type: {booking.machine?.type}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-medium">Acreage & Crop:</span>
            <p className="text-sm font-bold text-slate-800 mt-0.5">
              {booking.areaInAcres} Acres ({booking.cropType || 'Crop'})
            </p>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-medium">Assigned Operator:</span>
            <div className="mt-1 flex items-center space-x-3">
              <select
                value={booking.operatorId || ''}
                onChange={e =>
                  updateMutation.mutate({
                    operatorId: e.target.value || null,
                    status: e.target.value && booking.status === 'APPROVED' ? 'ASSIGNED' : booking.status,
                  })
                }
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-farm-600"
              >
                <option value="">No Operator Assigned</option>
                {operators?.map(op => (
                  <option key={op.id} value={op.id}>
                    {op.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule & AI Predicted Duration Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2 text-farm-700 font-bold text-sm">
            <Calendar className="w-4 h-4" />
            <span>Schedule & AI Prediction</span>
          </div>
          {booking.predictedDurationMinutes && (
            <span className="inline-flex items-center space-x-1 text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>AI Predicted: {booking.predictedDurationMinutes} mins</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500 font-medium block">Scheduled Start Time:</span>
            <span className="text-sm font-bold text-slate-900 mt-1 block">
              {new Date(booking.scheduledStart).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500 font-medium block">Scheduled End Time:</span>
            <span className="text-sm font-bold text-slate-900 mt-1 block">
              {new Date(booking.scheduledEnd).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
        </div>

        {/* Special Instructions */}
        {booking.specialInstructions && (
          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/60 text-xs text-amber-900 leading-relaxed font-medium">
            <span className="font-bold block mb-1">Special Field Notes:</span>
            {booking.specialInstructions}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div>
          {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              Cancel Booking
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {booking.status === 'ASSIGNED' && (
            <button
              onClick={() =>
                updateMutation.mutate({
                  status: 'IN_PROGRESS',
                  actualStart: new Date().toISOString(),
                })
              }
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all"
            >
              Mark In Progress
            </button>
          )}

          {booking.status === 'IN_PROGRESS' && (
            <button
              onClick={() =>
                updateMutation.mutate({
                  status: 'COMPLETED',
                  actualEnd: new Date().toISOString(),
                })
              }
              className="px-5 py-2.5 text-xs font-bold text-white bg-farm-600 hover:bg-farm-700 rounded-xl shadow-md transition-all"
            >
              Mark Completed
            </button>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking?"
        isDanger={true}
        onConfirm={() => cancelMutation.mutate()}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  );
};
