import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Send, Tractor, Calendar, MapPin, ArrowRight, Clock } from 'lucide-react';
import { api } from '../../../services/api.js';
import { useI18n } from '../../../i18n/index.js';
import { StatusBadge } from '../../../components/StatusBadge.js';
import { LoadingSpinner } from '../../../components/LoadingSpinner.js';

export const FarmerRequestsListPage: React.FC = () => {
  const { t } = useI18n();
  const [statusFilter, setStatusFilter] = useState('');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['farmerRequests', statusFilter],
    queryFn: () => api.farmer.getRequests({ status: statusFilter || undefined }),
  });

  const requestList = requests || [];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('farmer.requests.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track status of machinery requests submitted to your Custom Hiring Centre.
          </p>
        </div>

        <Link
          to="/farmer/requests/new"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-farm-600 hover:bg-farm-700 text-white font-bold text-sm shadow-md shadow-farm-600/20 transition-all hover:scale-[1.02] self-start sm:self-auto"
        >
          <Send className="w-4 h-4" />
          <span>{t('farmer.actions.newRequest')}</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {['', 'PENDING', 'APPROVED', 'ASSIGNED', 'COMPLETED', 'REJECTED'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              statusFilter === status
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {status === '' ? 'All Requests' : status}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingSpinner text="Fetching machinery requests..." />
        ) : requestList.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No requests found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Submit your required machinery specifications to schedule field work.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requestList.map(req => (
              <div
                key={req.id}
                className="p-5 sm:p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-black text-slate-400">REQ #{req.id}</span>
                    <StatusBadge status={req.status} size="sm" />
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    {req.requestedMachineType} • {req.areaInAcres} Acres ({req.cropType || 'Crop'})
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-farm-600" />
                      <span>{req.locationVillage} {req.locationField ? `(${req.locationField})` : ''}</span>
                    </span>

                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Preferred: {new Date(req.preferredDate).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </span>
                  </div>

                  {req.specialInstructions && (
                    <p className="text-xs text-slate-500 italic mt-1 max-w-xl">
                      "{req.specialInstructions}"
                    </p>
                  )}
                </div>

                <Link
                  to={`/farmer/requests/${req.id}`}
                  className="px-4 py-2 text-xs font-bold text-farm-700 bg-farm-50 hover:bg-farm-100 rounded-xl transition-colors flex items-center justify-center space-x-1.5 self-start sm:self-center"
                >
                  <span>View Timeline & Details</span>
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
