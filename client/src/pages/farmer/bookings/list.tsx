import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Tractor, Calendar, MapPin, ArrowRight, User } from 'lucide-react';
import { api } from '../../../services/api.js';
import { useI18n } from '../../../i18n/index.js';
import { StatusBadge } from '../../../components/StatusBadge.js';
import { LoadingSpinner } from '../../../components/LoadingSpinner.js';

export const FarmerBookingsListPage: React.FC = () => {
  const { t } = useI18n();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['farmerBookings'],
    queryFn: () => api.farmer.getBookings(),
  });

  const bookingList = bookings || [];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {t('farmer.bookings.title')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review your scheduled and completed machinery hiring reservations.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingSpinner text="Fetching your farm bookings..." />
        ) : bookingList.length === 0 ? (
          <div className="p-12 text-center">
            <Tractor className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No bookings scheduled yet</h3>
            <p className="text-xs text-slate-400 mt-1">
              Submit a machinery request to schedule equipment with your Custom Hiring Centre.
            </p>
            <Link
              to="/farmer/requests/new"
              className="mt-4 inline-block px-4 py-2 bg-farm-600 text-white rounded-xl text-xs font-bold shadow-md"
            >
              Request Machinery Now
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {bookingList.map(b => (
              <div
                key={b.id}
                className="p-5 sm:p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-slate-400">BOOKING #{b.id}</span>
                    <StatusBadge status={b.status} size="sm" />
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    {b.machine?.name} ({b.areaInAcres} Acres • {b.cropType || 'Crop'})
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-farm-600" />
                      <span>{b.locationVillage} {b.locationField ? `(${b.locationField})` : ''}</span>
                    </span>

                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {new Date(b.scheduledStart).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        at{' '}
                        {new Date(b.scheduledStart).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </span>

                    {b.operator && (
                      <span className="flex items-center space-x-1 text-slate-800 font-semibold">
                        <User className="w-3.5 h-3.5 text-orange-500" />
                        <span>Operator: {b.operator.name}</span>
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  to={`/farmer/bookings/${b.id}`}
                  className="px-4 py-2 text-xs font-bold text-farm-700 bg-farm-50 hover:bg-farm-100 rounded-xl transition-colors flex items-center justify-center space-x-1.5 self-start sm:self-center"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
