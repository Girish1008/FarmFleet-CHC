import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  Radio,
  FilePlus,
  Tractor,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertOctagon,
  CheckCircle,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useI18n } from '../../i18n/index.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import { LoadingSpinner } from '../../components/LoadingSpinner.js';

export const ChcDashboardPage: React.FC = () => {
  const { t } = useI18n();

  // Fetch bookings
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => api.bookings.list({ limit: 10 }),
  });

  // Fetch machines
  const { data: machinesData } = useQuery({
    queryKey: ['machines'],
    queryFn: () => api.machines.list(),
  });

  // Fetch pending schedule proposals
  const { data: proposalsData } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => api.schedule.listProposals(),
  });

  const bookings = bookingsData?.data || [];
  const machines = machinesData || [];
  const proposals = proposalsData || [];

  const activeBookingsCount = bookings.filter(
    b => b.status === 'IN_PROGRESS' || b.status === 'ASSIGNED'
  ).length;

  const pendingRequestsCount = bookings.filter(b => b.status === 'PENDING').length + 2; // demo requests
  const machinesInUseCount = machines.filter(m => m.status === 'ACTIVE').length;
  const todayJobsCount = bookings.length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('chc.dashboard.title')}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {t('chc.dashboard.subtitle')}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            to="/chc/bookings/new"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-farm-600 hover:bg-farm-700 text-white font-bold text-sm shadow-md shadow-farm-600/20 transition-all hover:scale-[1.02]"
          >
            <FilePlus className="w-4 h-4" />
            <span>{t('chc.actions.newBooking')}</span>
          </Link>

          <Link
            to="/chc/schedule"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-sm shadow-xs transition-all"
          >
            <CalendarDays className="w-4 h-4 text-farm-600" />
            <span>{t('chc.actions.viewSchedule')}</span>
          </Link>

          <Link
            to="/chc/tracking"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 font-bold text-sm transition-all"
          >
            <Radio className="w-4 h-4 text-orange-600 animate-pulse" />
            <span>{t('chc.actions.liveTracking')}</span>
          </Link>
        </div>
      </div>

      {/* Dynamic Rescheduling Alert Banner (if proposal pending) */}
      {proposals.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl mt-0.5">
              <AlertOctagon className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                  AI Reschedule Notice
                </span>
                <span className="text-xs text-slate-500">Reason: {proposals[0].reason}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {t('reschedule.proposalBanner')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
                {t('reschedule.bannerMessage')} {proposals[0].proposedChanges.details[0]?.changeReason}
              </p>
            </div>
          </div>
          <Link
            to="/chc/schedule"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 whitespace-nowrap self-end sm:self-center"
          >
            <span>Review & Accept Proposal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('chc.stats.activeBookings')}
            </span>
            <div className="p-2 rounded-xl bg-farm-50 text-farm-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{activeBookingsCount}</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              In field
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('chc.stats.pendingRequests')}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{pendingRequestsCount}</span>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
              Awaiting slot
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('chc.stats.machinesInUse')}
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Tractor className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{machinesInUseCount} / {machines.length}</span>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              Active fleet
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('chc.stats.todayJobs')}
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{todayJobsCount}</span>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
              Scheduled
            </span>
          </div>
        </div>
      </div>

      {/* Recent Fleet Activity */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t('chc.recentActivity')}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status across machinery dispatches, operators, and village fields
            </p>
          </div>
          <Link
            to="/chc/bookings"
            className="text-xs font-bold text-farm-600 hover:text-farm-800 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {bookingsLoading ? (
          <LoadingSpinner text="Loading recent fleet bookings..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Farmer & Village</th>
                  <th className="px-5 py-3.5">Machinery & Area</th>
                  <th className="px-5 py-3.5">Scheduled Slot</th>
                  <th className="px-5 py-3.5">Operator</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {bookings.slice(0, 6).map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{b.farmer?.name || 'Farmer'}</div>
                      <div className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{b.locationVillage} {b.locationField ? `• ${b.locationField}` : ''}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{b.machine?.name}</div>
                      <div className="text-xs text-farm-700 font-bold mt-0.5">
                        {b.areaInAcres} Acres ({b.cropType || 'Crop'})
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs font-bold text-slate-800">
                        {new Date(b.scheduledStart).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(b.scheduledStart).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(b.scheduledEnd).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {b.operator ? (
                        <div className="text-xs font-bold text-slate-900">{b.operator.name}</div>
                      ) : (
                        <span className="text-xs text-amber-600 italic font-semibold">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={b.status} size="sm" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/chc/bookings/${b.id}`}
                        className="px-3 py-1.5 text-xs font-bold text-farm-700 bg-farm-50 hover:bg-farm-100 rounded-lg transition-colors inline-block"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
