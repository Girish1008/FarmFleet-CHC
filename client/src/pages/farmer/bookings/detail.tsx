import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Tractor,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { api } from '../../../services/api.js';
import { useI18n } from '../../../i18n/index.js';
import { StatusBadge } from '../../../components/StatusBadge.js';
import { LoadingSpinner } from '../../../components/LoadingSpinner.js';
import { ConfirmModal } from '../../../components/ConfirmModal.js';
import { SuccessToast } from '../../../components/SuccessToast.js';

export const FarmerBookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['farmerBooking', id],
    queryFn: () => api.farmer.getBookingById(id!),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.farmer.cancelBooking(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmerBooking', id] });
      queryClient.invalidateQueries({ queryKey: ['farmerBookings'] });
      setShowCancelModal(false);
      setToastMessage('Booking cancelled successfully');
    },
  });

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading booking details..." />;
  }

  if (!booking) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-bold text-slate-800">Booking not found</h2>
        <Link to="/farmer/bookings" className="text-sm font-semibold text-farm-600 mt-2 inline-block">
          &larr; Back to bookings
        </Link>
      </div>
    );
  }

  const canCancel = booking.status === 'PENDING' || booking.status === 'APPROVED';

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {toastMessage && (
        <SuccessToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}

      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/farmer/bookings')}
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
            Confirmed with Custom Hiring Centre
          </p>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="p-3 bg-farm-50 text-farm-700 rounded-2xl">
            <Tractor className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">{booking.machine?.name}</h2>
            <p className="text-xs text-slate-500">
              Type: {booking.machine?.type} • Area: {booking.areaInAcres} Acres ({booking.cropType || 'Wheat'})
            </p>
          </div>
        </div>

        {/* Schedule Timings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-400 font-medium block">Scheduled Start:</span>
            <span className="text-sm font-bold text-slate-900 mt-1 block">
              {new Date(booking.scheduledStart).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-400 font-medium block">Estimated Completion:</span>
            <span className="text-sm font-bold text-slate-900 mt-1 block">
              {new Date(booking.scheduledEnd).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
        </div>

        {/* Assigned Operator Contact */}
        <div className="p-5 bg-gradient-to-br from-slate-50 to-orange-50/40 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-orange-100 text-orange-700 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium block">Assigned Machine Operator</span>
              <span className="text-sm font-bold text-slate-900 block">
                {booking.operator?.name || 'Assigned by CHC on dispatch'}
              </span>
            </div>
          </div>

          {booking.operator?.phone && (
            <a
              href={`tel:${booking.operator.phone}`}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 shadow-xs"
            >
              <Phone className="w-3.5 h-3.5 text-farm-600" />
              <span>Call Operator ({booking.operator.phone})</span>
            </a>
          )}
        </div>

        {/* Field Location */}
        <div>
          <span className="text-xs text-slate-400 font-medium block">Field Location:</span>
          <p className="text-sm font-semibold text-slate-800 mt-1">
            Village {booking.locationVillage}
            {booking.locationField ? `, ${booking.locationField}` : ''}
            {booking.locationLandmark ? ` (Landmark: ${booking.locationLandmark})` : ''}
          </p>
        </div>

        {/* Optional Cancel */}
        {canCancel && (
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              Cancel Machinery Booking
            </button>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking with the Custom Hiring Centre?"
        isDanger={true}
        isLoading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  );
};
