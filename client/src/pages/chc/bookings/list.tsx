import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FilePlus,
  Search,
  Filter,
  Calendar,
  Tractor,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Phone,
  Trash2,
  Eye,
} from 'lucide-react';
import { api } from '../../../services/api.js';
import { useI18n } from '../../../i18n/index.js';
import { StatusBadge } from '../../../components/StatusBadge.js';
import { LoadingSpinner } from '../../../components/LoadingSpinner.js';
import { ConfirmModal } from '../../../components/ConfirmModal.js';
import { SuccessToast } from '../../../components/SuccessToast.js';

export const BookingsListPage: React.FC = () => {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [machineFilter, setMachineFilter] = useState('');
  const [page, setPage] = useState(1);
  const [cancelModalBookingId, setCancelModalBookingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch bookings
  const { data, isLoading } = useQuery({
    queryKey: ['bookings', { status: statusFilter, machineId: machineFilter, search, page }],
    queryFn: () =>
      api.bookings.list({
        status: statusFilter || undefined,
        machineId: machineFilter || undefined,
        search: search || undefined,
        page,
        limit: 8,
      }),
  });

  // Fetch machines for filter dropdown
  const { data: machines } = useQuery({
    queryKey: ['machines'],
    queryFn: () => api.machines.list(),
  });

  // Cancel booking mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.bookings.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setCancelModalBookingId(null);
      setToastMessage('Booking cancelled successfully');
    },
  });

  const bookings = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {toastMessage && (
        <SuccessToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('bookings.title')}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {t('bookings.subtitle')}
          </p>
        </div>

        <Link
          to="/chc/bookings/new"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-farm-600 hover:bg-farm-700 text-white font-bold text-sm shadow-md shadow-farm-600/20 transition-all hover:scale-[1.02] self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-farm-200" />
          <span>{t('bookings.new.title')}</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search farmer or village..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-farm-600 focus:bg-white text-slate-900"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-farm-600 focus:bg-white text-slate-900"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="IN_PROGRESS">IN PROGRESS (Live)</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        {/* Machine Filter */}
        <div>
          <select
            value={machineFilter}
            onChange={e => {
              setMachineFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-farm-600 focus:bg-white text-slate-900"
          >
            <option value="">All Machinery</option>
            {machines?.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.type})
              </option>
            ))}
          </select>
        </div>

        {/* Reset Filters */}
        <button
          onClick={() => {
            setSearch('');
            setStatusFilter('');
            setMachineFilter('');
            setPage(1);
          }}
          className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
        >
          Reset All Filters
        </button>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingSpinner text="Fetching bookings from database..." />
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center">
            <Tractor className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No bookings match criteria</h3>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search terms or filters above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-4">Farmer Details</th>
                  <th className="px-5 py-4">Machinery & Acreage</th>
                  <th className="px-5 py-4">Field Location</th>
                  <th className="px-5 py-4">Schedule</th>
                  <th className="px-5 py-4">Operator</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{b.farmer?.name || 'Farmer'}</div>
                      {b.farmer?.phone && (
                        <div className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{b.farmer.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-800">{b.machine?.name}</div>
                      <div className="text-xs font-semibold text-farm-700 mt-0.5">
                        {b.areaInAcres} Acres • {b.cropType || 'Crop'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs font-bold text-slate-900 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-farm-600 flex-shrink-0" />
                        <span>{b.locationVillage}</span>
                      </div>
                      {b.locationField && (
                        <div className="text-xs text-slate-500 ml-4">{b.locationField}</div>
                      )}
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
                        <span className="text-xs font-bold text-slate-900">{b.operator.name}</span>
                      ) : (
                        <span className="text-xs text-amber-600 italic font-semibold">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={b.status} size="sm" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/chc/bookings/${b.id}`}
                          className="p-1.5 text-slate-600 hover:text-farm-700 hover:bg-farm-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                          <button
                            onClick={() => setCancelModalBookingId(b.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancel Booking"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total bookings)
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Cancellation Modal */}
      <ConfirmModal
        isOpen={!!cancelModalBookingId}
        title="Cancel Machinery Booking"
        message="Are you sure you want to cancel this booking? This will free the equipment and operator slot in the CHC schedule."
        isDanger={true}
        confirmLabel="Yes, Cancel Booking"
        isLoading={cancelMutation.isPending}
        onConfirm={() => {
          if (cancelModalBookingId) cancelMutation.mutate(cancelModalBookingId);
        }}
        onCancel={() => setCancelModalBookingId(null)}
      />
    </div>
  );
};
