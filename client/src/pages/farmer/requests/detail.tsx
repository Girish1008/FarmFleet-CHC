import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Tractor,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  AlertCircle,
  Phone,
  User,
} from 'lucide-react';
import { api } from '../../../services/api.js';
import { useI18n } from '../../../i18n/index.js';
import { StatusBadge } from '../../../components/StatusBadge.js';
import { LoadingSpinner } from '../../../components/LoadingSpinner.js';

export const FarmerRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const navigate = useNavigate();

  const { data: request, isLoading } = useQuery({
    queryKey: ['farmerRequest', id],
    queryFn: () => api.farmer.getRequestById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading request details..." />;
  }

  if (!request) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-bold text-slate-800">Request not found</h2>
        <Link to="/farmer/requests" className="text-sm font-semibold text-farm-600 mt-2 inline-block">
          &larr; Back to requests
        </Link>
      </div>
    );
  }

  const steps = [
    { title: 'Request Submitted', desc: 'Received by CHC manager', key: 'PENDING' },
    { title: 'Request Approved', desc: 'Equipment slot validated', key: 'APPROVED' },
    { title: 'Machinery & Operator Assigned', desc: 'Tractor scheduled for field dispatch', key: 'ASSIGNED' },
    { title: 'Field Operation In Progress', desc: 'Tractor active on your acreage', key: 'IN_PROGRESS' },
    { title: 'Operation Completed', desc: 'Work done & logged in CHC', key: 'COMPLETED' },
  ];

  const getStepStatus = (stepKey: string) => {
    const order = ['PENDING', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'];
    const currentIndex = order.indexOf(request.status);
    const stepIndex = order.indexOf(stepKey);

    if (request.status === 'REJECTED') {
      return stepKey === 'PENDING' ? 'completed' : 'rejected';
    }

    if (currentIndex >= stepIndex) return 'completed';
    if (currentIndex + 1 === stepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/farmer/requests')}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Request #{request.id}
            </h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Submitted on {new Date(request.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-slate-900">Request Progress Timeline</h2>

        <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 ml-3">
          {steps.map((step, idx) => {
            const status = getStepStatus(step.key);
            return (
              <div key={idx} className="relative">
                {/* Circle Icon */}
                <span
                  className={`absolute -left-[33px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white ${
                    status === 'completed'
                      ? 'border-farm-600 text-farm-600'
                      : status === 'current'
                      ? 'border-amber-500 text-amber-500 animate-pulse'
                      : 'border-slate-300 text-slate-300'
                  }`}
                >
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 fill-farm-600 text-white" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-current" />
                  )}
                </span>

                <div>
                  <h3
                    className={`text-sm font-bold ${
                      status === 'completed'
                        ? 'text-slate-900'
                        : status === 'current'
                        ? 'text-amber-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Linked Booking Info (if approved/assigned) */}
      {request.linkedBooking && (
        <div className="bg-gradient-to-br from-farm-50 to-white p-6 rounded-3xl border-2 border-farm-300 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-farm-800 font-bold text-sm">
              <Tractor className="w-5 h-5 text-farm-600" />
              <span>Assigned Machinery & Operation Schedule</span>
            </div>
            <Link
              to={`/farmer/bookings/${request.linkedBooking.id}`}
              className="text-xs font-bold text-farm-700 hover:text-farm-900 underline"
            >
              View Full Booking &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-white rounded-2xl border border-farm-200">
              <span className="text-slate-500 font-medium block">Machine Allocated:</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                {request.linkedBooking.machine?.name}
              </span>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-farm-200">
              <span className="text-slate-500 font-medium block">Assigned Operator:</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                {request.linkedBooking.operator?.name || 'Suresh Kumar (Tractor Specialist)'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Request Specifications */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Requested Parameters
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-medium block">Machine Type:</span>
            <span className="text-slate-900 font-bold text-sm mt-0.5 block">
              {request.requestedMachineType}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-medium block">Field Area:</span>
            <span className="text-slate-900 font-bold text-sm mt-0.5 block">
              {request.areaInAcres} Acres
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-medium block">Crop:</span>
            <span className="text-slate-900 font-bold text-sm mt-0.5 block">
              {request.cropType || 'Wheat'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-medium block">Preferred Date:</span>
            <span className="text-slate-900 font-bold text-sm mt-0.5 block">
              {new Date(request.preferredDate).toLocaleDateString([], { dateStyle: 'medium' })}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-medium block">Village:</span>
            <span className="text-slate-900 font-bold text-sm mt-0.5 block">
              {request.locationVillage}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-medium block">Landmark:</span>
            <span className="text-slate-900 font-bold text-sm mt-0.5 block">
              {request.locationLandmark || 'Near Village Canal'}
            </span>
          </div>
        </div>

        {request.specialInstructions && (
          <div className="p-3.5 bg-slate-50 rounded-2xl text-xs text-slate-700 italic border border-slate-200 mt-2">
            Special Instructions: "{request.specialInstructions}"
          </div>
        )}
      </div>
    </div>
  );
};
