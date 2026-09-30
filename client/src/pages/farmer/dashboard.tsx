import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Tractor,
  Send,
  ClipboardList,
  CalendarDays,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useI18n } from '../../i18n/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import { LoadingSpinner } from '../../components/LoadingSpinner.js';

export const FarmerDashboardPage: React.FC = () => {
  const { t } = useI18n();
  const { user } = useAuth();

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['farmerRequests'],
    queryFn: () => api.farmer.getRequests(),
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['farmerBookings'],
    queryFn: () => api.farmer.getBookings(),
  });

  const allRequests = requests || [];
  const allBookings = bookings || [];

  const activeRequestsCount = allRequests.filter(r => r.status === 'PENDING').length;
  const approvedBookingsCount = allBookings.filter(
    b => b.status === 'APPROVED' || b.status === 'ASSIGNED' || b.status === 'IN_PROGRESS'
  ).length;
  const completedJobsCount = allBookings.filter(b => b.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-farm-800 via-farm-700 to-farm-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider bg-white/20 text-farm-100 px-3 py-1 rounded-full inline-block mb-3">
            Farmer Custom Hiring Centre Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Namaste, {user?.name || 'Farmer'}!
          </h1>
          <p className="text-xs sm:text-sm text-farm-100 mt-2 leading-relaxed">
            Rent high-torque tractors, rotavators, happy seeders, and combine harvesters directly from your village Custom Hiring Centre cluster.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/farmer/requests/new"
              className="px-5 py-3 rounded-2xl bg-white text-farm-900 font-bold text-sm shadow-md hover:bg-farm-50 transition-all hover:scale-105 flex items-center space-x-2"
            >
              <Send className="w-4 h-4 text-farm-700" />
              <span>{t('farmer.actions.newRequest')}</span>
            </Link>

            <Link
              to="/farmer/requests"
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-colors flex items-center space-x-2"
            >
              <ClipboardList className="w-4 h-4" />
              <span>{t('farmer.actions.viewRequests')}</span>
            </Link>
          </div>
        </div>

        <Tractor className="absolute -right-8 -bottom-8 w-64 h-64 text-white/10 pointer-events-none" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('farmer.stats.activeRequests')}
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1">{activeRequestsCount}</div>
            <span className="text-xs text-amber-600 font-semibold">Under CHC review</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('farmer.stats.approvedBookings')}
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1">{approvedBookingsCount}</div>
            <span className="text-xs text-farm-600 font-semibold">Scheduled & on field</span>
          </div>
          <div className="p-3 bg-farm-50 text-farm-600 rounded-2xl">
            <Tractor className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('farmer.stats.completedJobs')}
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1">{completedJobsCount}</div>
            <span className="text-xs text-emerald-600 font-semibold">Completed operations</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Recent Machinery Bookings & Requests</h2>
          <Link
            to="/farmer/bookings"
            className="text-xs font-bold text-farm-600 hover:text-farm-800 flex items-center space-x-1"
          >
            <span>View All Bookings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {bookingsLoading ? (
          <LoadingSpinner text="Loading bookings..." />
        ) : allBookings.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No bookings recorded yet. Click "Request Machinery" above to submit a new requirement.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {allBookings.slice(0, 5).map(b => (
              <div
                key={b.id}
                className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 bg-farm-50 text-farm-700 rounded-2xl mt-0.5">
                    <Tractor className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{b.machine?.name}</h3>
                    <div className="text-xs text-slate-500 flex items-center space-x-2 mt-1">
                      <span>{b.areaInAcres} Acres</span>
                      <span>•</span>
                      <span>{b.cropType || 'Crop'}</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{b.locationVillage}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <StatusBadge status={b.status} size="sm" />
                  <Link
                    to={`/farmer/bookings/${b.id}`}
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
