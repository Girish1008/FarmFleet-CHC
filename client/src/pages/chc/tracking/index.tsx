import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Radio, Tractor, MapPin, User, ArrowRight, Gauge, Clock } from 'lucide-react';
import { api } from '../../../services/api.js';
import { useI18n } from '../../../i18n/index.js';
import { StatusBadge } from '../../../components/StatusBadge.js';
import { LoadingSpinner } from '../../../components/LoadingSpinner.js';

export const ChcTrackingListPage: React.FC = () => {
  const { t } = useI18n();

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => api.bookings.list(),
    refetchInterval: 15000,
  });

  const activeBookings = (bookingsData?.data || []).filter(
    b => b.status === 'IN_PROGRESS' || b.status === 'ASSIGNED'
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      <div>
        <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-orange-600 bg-orange-100 px-3 py-1 rounded-full w-max mb-2">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Real-time Telemetry Dispatch</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {t('tracking.title')}
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          {t('tracking.subtitle')}
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Scanning active fleet GPS broadcasts..." />
      ) : activeBookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
          <Tractor className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Machinery Currently In Field</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Live GPS telemetry broadcasts when an operator starts a job from their mobile device.
          </p>
          <Link
            to="/chc/bookings"
            className="mt-4 inline-block text-xs font-bold text-farm-600 hover:text-farm-800"
          >
            Check All Bookings &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeBookings.map(b => (
            <div
              key={b.id}
              className="bg-white rounded-3xl border border-slate-200 hover:border-orange-400 p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-5 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">ID #{b.id}</span>
                  <StatusBadge status={b.status} size="sm" />
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                    {b.machine?.name}
                  </h3>
                  <div className="text-xs font-semibold text-slate-500 mt-0.5">
                    {b.areaInAcres} Acres • {b.cropType || 'Crop'}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center space-x-2 text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>Farmer: <strong className="text-slate-900">{b.farmer?.name}</strong></span>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-farm-600 flex-shrink-0" />
                    <span>Village: <strong className="text-slate-900">{b.locationVillage}</strong></span>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-700">
                    <Tractor className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                    <span>Operator: <strong className="text-slate-900">{b.operator?.name || 'Unassigned'}</strong></span>
                  </div>
                </div>
              </div>

              <Link
                to={`/chc/tracking/${b.id}`}
                className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>View Live GPS on Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
