import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  Send,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ArrowRight,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../../services/api.js';
import { useI18n } from '../../../i18n/index.js';
import { StatusBadge } from '../../../components/StatusBadge.js';
import { LoadingSpinner } from '../../../components/LoadingSpinner.js';
import { ConfirmModal } from '../../../components/ConfirmModal.js';
import { SuccessToast } from '../../../components/SuccessToast.js';
import { FarmerRequest, Machine, Booking } from '../../../types/index.js';

export const BookingsListPage: React.FC = () => {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: 'bookings' | 'requests'
  const activeTab = searchParams.get('tab') === 'requests' ? 'requests' : 'bookings';

  // Bookings Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [machineFilter, setMachineFilter] = useState('');
  const [page, setPage] = useState(1);
  const [cancelModalBookingId, setCancelModalBookingId] = useState<string | null>(null);

  // Farmer Requests Filter & Action State
  const [reqStatusFilter, setReqStatusFilter] = useState<string>('');
  const [acceptModalRequest, setAcceptModalRequest] = useState<FarmerRequest | null>(null);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [rejectModalRequestId, setRejectModalRequestId] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch bookings
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
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

  // Fetch farmer requests
  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['farmerRequests', reqStatusFilter],
    queryFn: () => api.farmer.getRequests({ status: reqStatusFilter || undefined }),
  });

  // Fetch machines
  const { data: machines } = useQuery({
    queryKey: ['machines'],
    queryFn: () => api.machines.list(),
  });

  // Fetch operators
  const { data: operators } = useQuery({
    queryKey: ['users', 'OPERATOR'],
    queryFn: () => api.users.list({ role: 'OPERATOR' }),
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

  // Accept farmer request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: ({
      id,
      machineId,
      operatorId,
      scheduledStart,
    }: {
      id: string;
      machineId?: string;
      operatorId?: string;
      scheduledStart?: string;
    }) =>
      api.farmer.acceptRequest(id, {
        machineId,
        operatorId,
        scheduledStart,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmerRequests'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setAcceptModalRequest(null);
      setToastMessage('Farmer request accepted and scheduled into CHC bookings successfully!');
    },
  });

  // Reject farmer request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: (id: string) => api.farmer.rejectRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmerRequests'] });
      setRejectModalRequestId(null);
      setToastMessage('Farmer request marked as declined.');
    },
  });

  const bookings = bookingsData?.data || [];
  const pagination = bookingsData?.pagination || { page: 1, totalPages: 1, total: 0 };
  const requests = requestsData || [];
  const pendingRequestsCount = requests.filter(r => r.status === 'PENDING').length;

  const handleOpenAcceptModal = (req: FarmerRequest) => {
    setAcceptModalRequest(req);
    // Auto-select first matching machine
    const matchingMachine = machines?.find(
      m => m.type.toUpperCase() === req.requestedMachineType.toUpperCase() && m.status === 'ACTIVE'
    ) || machines?.find(m => m.status === 'ACTIVE');
    setSelectedMachineId(matchingMachine?.id || '');

    // Auto-select first operator
    setSelectedOperatorId(operators?.[0]?.id || '');

    // Date
    const d = new Date(req.preferredDate);
    d.setHours(9, 0, 0, 0);
    setScheduledDate(d.toISOString().slice(0, 16));
  };

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

      {/* View Switcher Tabs (All CHC Bookings vs Incoming Farmer Requests) */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
        <button
          onClick={() => setSearchParams({ tab: 'bookings' })}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'bookings'
              ? 'border-farm-600 text-farm-700 bg-farm-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>All CHC Bookings ({pagination.total || bookings.length})</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'requests' })}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all flex items-center space-x-2.5 ${
            activeTab === 'requests'
              ? 'border-farm-600 text-farm-700 bg-farm-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Incoming Farmer Requests</span>
          {pendingRequestsCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-black rounded-full bg-amber-500 text-white shadow-xs">
              {pendingRequestsCount} Pending
            </span>
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: ALL CHC BOOKINGS VIEW                                   */}
      {/* ============================================================== */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
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
            {bookingsLoading ? (
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
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: INCOMING FARMER REQUESTS VIEW                           */}
      {/* ============================================================== */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Request Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: '', label: 'All Requests' },
              { id: 'PENDING', label: 'Pending Approval' },
              { id: 'APPROVED', label: 'Approved & Scheduled' },
              { id: 'REJECTED', label: 'Declined' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setReqStatusFilter(f.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  reqStatusFilter === f.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Farmer Requests Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {requestsLoading ? (
              <LoadingSpinner text="Fetching farmer requests..." />
            ) : requests.length === 0 ? (
              <div className="p-12 text-center">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">No requests found</h3>
                <p className="text-xs text-slate-400 mt-1">
                  When farmers submit machinery requirements through their portal, they will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm divide-y divide-slate-100">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                    <tr>
                      <th className="px-5 py-4">Farmer Info</th>
                      <th className="px-5 py-4">Requested Machinery</th>
                      <th className="px-5 py-4">Field Location</th>
                      <th className="px-5 py-4">Preferred Date</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {requests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">{req.farmer?.name || 'Farmer'}</div>
                          {req.farmer?.phone && (
                            <div className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{req.farmer.phone}</span>
                            </div>
                          )}
                          <span className="text-[10px] text-slate-400 block mt-0.5">REQ #{req.id}</span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-800">{req.requestedMachineType}</div>
                          <div className="text-xs font-semibold text-farm-700 mt-0.5">
                            {req.areaInAcres} Acres • {req.cropType || 'Crop'}
                          </div>
                          {req.specialInstructions && (
                            <div className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">
                              Note: {req.specialInstructions}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="text-xs font-bold text-slate-900 flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-farm-600 flex-shrink-0" />
                            <span>{req.locationVillage}</span>
                          </div>
                          {req.locationField && (
                            <div className="text-xs text-slate-500 ml-4">{req.locationField}</div>
                          )}
                          {req.locationLandmark && (
                            <div className="text-[11px] text-slate-400 ml-4">Near: {req.locationLandmark}</div>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {new Date(req.preferredDate).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Submitted: {new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={req.status} size="sm" />
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {req.status === 'PENDING' ? (
                              <>
                                <button
                                  onClick={() => handleOpenAcceptModal(req)}
                                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-105"
                                  title="Accept and create booking"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Accept & Schedule</span>
                                </button>
                                <button
                                  onClick={() => setRejectModalRequestId(req.id)}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold transition-colors"
                                  title="Decline request"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Decline</span>
                                </button>
                              </>
                            ) : req.status === 'APPROVED' ? (
                              <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Scheduled</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-xs font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
                                <span>Declined</span>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ACCEPT FARMER REQUEST MODAL                                    */}
      {/* ============================================================== */}
      {acceptModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Accept Farmer Request</h3>
                  <p className="text-xs text-slate-500">
                    Schedule equipment & operator for {acceptModalRequest.farmer?.name || 'Farmer'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAcceptModalRequest(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Request Summary Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Requested Machine:</span>
                <span className="text-farm-700 font-black">{acceptModalRequest.requestedMachineType}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Field Area & Crop:</span>
                <span>{acceptModalRequest.areaInAcres} Acres • {acceptModalRequest.cropType || 'Crop'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Location:</span>
                <span>{acceptModalRequest.locationVillage} {acceptModalRequest.locationField ? `(${acceptModalRequest.locationField})` : ''}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Preferred Date:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(acceptModalRequest.preferredDate).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Assignment Configuration */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assign Machinery
                </label>
                <select
                  value={selectedMachineId}
                  onChange={e => setSelectedMachineId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-farm-600 text-slate-900"
                >
                  <option value="">Select Machinery...</option>
                  {machines?.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.type}) - {m.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assign Operator
                </label>
                <select
                  value={selectedOperatorId}
                  onChange={e => setSelectedOperatorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-farm-600 text-slate-900"
                >
                  <option value="">Select Operator...</option>
                  {operators?.map(op => (
                    <option key={op.id} value={op.id}>
                      {op.name} ({op.phone || 'No phone'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Scheduled Start Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-farm-600 text-slate-900"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAcceptModalRequest(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={acceptRequestMutation.isPending}
                onClick={() => {
                  acceptRequestMutation.mutate({
                    id: acceptModalRequest.id,
                    machineId: selectedMachineId || undefined,
                    operatorId: selectedOperatorId || undefined,
                    scheduledStart: scheduledDate || undefined,
                  });
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center space-x-2"
              >
                {acceptRequestMutation.isPending ? (
                  <span>Scheduling...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Create Booking</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      <ConfirmModal
        isOpen={!!rejectModalRequestId}
        title="Decline Farmer Request"
        message="Are you sure you want to decline this farmer request? The farmer will be notified in their portal."
        isDanger={true}
        confirmLabel="Yes, Decline Request"
        isLoading={rejectRequestMutation.isPending}
        onConfirm={() => {
          if (rejectModalRequestId) rejectRequestMutation.mutate(rejectModalRequestId);
        }}
        onCancel={() => setRejectModalRequestId(null)}
      />

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
