import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Clock,
  Tractor,
  User,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  MoveRight,
  RefreshCw,
  PlusCircle,
  MapPin,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useI18n } from '../../i18n/index.js';
import { Booking, ScheduleChangeProposal, ProposalReason } from '../../types/index.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import { LoadingSpinner } from '../../components/LoadingSpinner.js';
import { SuccessToast } from '../../components/SuccessToast.js';
import { ConfirmModal } from '../../components/ConfirmModal.js';

export const SchedulePage: React.FC = () => {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedMachineFilter, setSelectedMachineFilter] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reschedule Modal State
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');

  // Fetch schedule bookings
  const { data: scheduleBookings, isLoading } = useQuery({
    queryKey: ['schedule', selectedMachineFilter],
    queryFn: () => api.schedule.get({ machineId: selectedMachineFilter || undefined }),
  });

  // Fetch machines
  const { data: machines } = useQuery({
    queryKey: ['machines'],
    queryFn: () => api.machines.list(),
  });

  // Fetch active proposals for dynamic rescheduling
  const { data: proposals, refetch: refetchProposals } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => api.schedule.listProposals(),
  });

  // Accept Reschedule Proposal Mutation
  const acceptProposalMutation = useMutation({
    mutationFn: (proposalId: string) => api.schedule.acceptReschedule({ proposalId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setToastMessage('Schedule change proposal accepted and applied!');
    },
  });

  // Reject Proposal Mutation
  const rejectProposalMutation = useMutation({
    mutationFn: (proposalId: string) => api.schedule.rejectReschedule({ proposalId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      setToastMessage('Schedule proposal dismissed');
    },
  });

  // Manual Reschedule Booking Mutation
  const updateTimesMutation = useMutation({
    mutationFn: (payload: { id: string; scheduledStart: string; scheduledEnd: string }) =>
      api.bookings.update(payload.id, {
        scheduledStart: payload.scheduledStart,
        scheduledEnd: payload.scheduledEnd,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setRescheduleBooking(null);
      setToastMessage('Job rescheduled successfully');
    },
  });

  // Trigger AI Disruption Simulation for demonstration
  const triggerSimulationMutation = useMutation({
    mutationFn: (reason: ProposalReason) =>
      api.schedule.proposeReschedule({
        reason,
        scope: { delayMinutes: 60 },
      }),
    onSuccess: () => {
      refetchProposals();
      setToastMessage('Simulated machinery disruption: AI generated re-allocation proposal');
    },
  });

  const bookings = scheduleBookings || [];
  const activeProposal = proposals && proposals.length > 0 ? proposals[0] : null;

  const handleOpenReschedule = (b: Booking) => {
    setRescheduleBooking(b);
    setNewStartTime(new Date(b.scheduledStart).toISOString().slice(0, 16));
    setNewEndTime(new Date(b.scheduledEnd).toISOString().slice(0, 16));
  };

  const handleConfirmReschedule = () => {
    if (!rescheduleBooking) return;
    updateTimesMutation.mutate({
      id: rescheduleBooking.id,
      scheduledStart: new Date(newStartTime).toISOString(),
      scheduledEnd: new Date(newEndTime).toISOString(),
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {toastMessage && (
        <SuccessToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('schedule.title')}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {t('schedule.subtitle')}
          </p>
        </div>

        {/* AI Disruption Simulator trigger pills */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-400 hidden md:inline">Simulate Disruption:</span>
          <button
            onClick={() => triggerSimulationMutation.mutate('BREAKDOWN')}
            disabled={triggerSimulationMutation.isPending}
            className="px-3 py-1.5 text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl transition-colors border border-amber-300"
            title="Simulate sudden tractor hydraulic breakdown"
          >
            ⚡ Machine Breakdown
          </button>
          <button
            onClick={() => triggerSimulationMutation.mutate('DELAY')}
            disabled={triggerSimulationMutation.isPending}
            className="px-3 py-1.5 text-xs font-bold bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-xl transition-colors border border-blue-300"
            title="Simulate field rain delay"
          >
            🌧️ Rain Delay
          </button>
        </div>
      </div>

      {/* Dynamic Rescheduling Modal/Banner UI (Feature 6) */}
      {activeProposal && (
        <div className="bg-gradient-to-br from-amber-500/15 via-white to-amber-500/5 rounded-3xl border-2 border-amber-400 p-6 sm:p-7 shadow-lg space-y-5 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-md shadow-amber-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-md">
                  Dynamic Rescheduling Proposal #{activeProposal.id}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  A schedule change is suggested due to {activeProposal.reason}
                </h3>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 self-end sm:self-center">
              <button
                onClick={() => rejectProposalMutation.mutate(activeProposal.id)}
                disabled={rejectProposalMutation.isPending}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors"
              >
                {t('reschedule.reject')}
              </button>
              <button
                onClick={() => acceptProposalMutation.mutate(activeProposal.id)}
                disabled={acceptProposalMutation.isPending}
                className="px-5 py-2 text-xs font-black text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md shadow-amber-600/30 transition-all flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('reschedule.accept')}</span>
              </button>
            </div>
          </div>

          {/* Diff comparison table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              {t('reschedule.diffTitle')} ({activeProposal.proposedChanges.details.length} Affected Jobs)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeProposal.proposedChanges.details.map((change, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-2xl border border-amber-300/80 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{change.farmerName}</span>
                    <span className="text-xs font-semibold text-slate-500">{change.machineName}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[11px] text-red-600 font-bold block">
                        Old Scheduled Time:
                      </span>
                      <span className="text-slate-700 font-semibold line-through">
                        {new Date(change.oldStart).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(change.oldEnd).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-emerald-700 font-bold block">
                        New AI Proposed Time:
                      </span>
                      <span className="text-emerald-900 font-black">
                        {new Date(change.newStart).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(change.newEnd).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 italic">
                    Reason: {change.changeReason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Machinery bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Tractor className="w-4 h-4 text-slate-400" />
            <select
              value={selectedMachineFilter}
              onChange={e => setSelectedMachineFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-farm-600"
            >
              <option value="">All Fleet Machinery</option>
              {machines?.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{bookings.length}</span> scheduled jobs
        </div>
      </div>

      {/* Calendar Machine Track Cards View */}
      {isLoading ? (
        <LoadingSpinner text="Loading machinery calendar schedule..." />
      ) : (
        <div className="space-y-4">
          {machines?.map(machine => {
            const machineBookings = bookings.filter(b => b.machineId === machine.id);
            if (selectedMachineFilter && machine.id !== selectedMachineFilter) return null;

            return (
              <div
                key={machine.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4"
              >
                {/* Machine Track Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-farm-50 text-farm-700">
                      <Tractor className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{machine.name}</h3>
                      <span className="text-xs text-slate-400">
                        Type: {machine.type} • Status: {machine.status}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {machineBookings.length} Scheduled Operations
                  </span>
                </div>

                {/* Job Blocks along timeline */}
                {machineBookings.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                    No field operations currently scheduled for this machine today.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {machineBookings.map(b => (
                      <div
                        key={b.id}
                        className="bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3 group"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900">
                              {b.farmer?.name || 'Farmer'}
                            </span>
                            <StatusBadge status={b.status} size="sm" />
                          </div>

                          <div className="text-xs font-semibold text-slate-600 flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-farm-600" />
                            <span>{b.locationVillage} ({b.areaInAcres} ac • {b.cropType || 'Crop'})</span>
                          </div>

                          <div className="text-xs text-slate-700 font-bold flex items-center space-x-1.5 bg-white p-2 rounded-xl border border-slate-200">
                            <Clock className="w-3.5 h-3.5 text-farm-600 flex-shrink-0" />
                            <span>
                              {new Date(b.scheduledStart).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              -{' '}
                              {new Date(b.scheduledEnd).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          {/* Highlight jobs with predictedDurationMinutes */}
                          {b.predictedDurationMinutes && (
                            <div className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 flex items-center justify-between">
                              <span className="flex items-center space-x-1">
                                <Sparkles className="w-3 h-3 text-purple-600" />
                                <span>{t('schedule.predictiveDuration')}</span>
                              </span>
                              <span>{b.predictedDurationMinutes} mins</span>
                            </div>
                          )}
                        </div>

                        {/* Drag-and-drop / Reschedule Action */}
                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">
                            Op: {b.operator?.name || 'Unassigned'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenReschedule(b)}
                            className="px-2.5 py-1 text-xs font-bold text-farm-700 hover:text-farm-900 hover:bg-farm-100 rounded-lg transition-colors flex items-center space-x-1"
                          >
                            <span>Reschedule</span>
                            <MoveRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Reschedule Confirm Modal */}
      {rescheduleBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Reschedule Field Operation
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Moving job for {rescheduleBooking.farmer?.name} ({rescheduleBooking.machine?.name})
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Start Time
                </label>
                <input
                  type="datetime-local"
                  value={newStartTime}
                  onChange={e => setNewStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New End Time
                </label>
                <input
                  type="datetime-local"
                  value={newEndTime}
                  onChange={e => setNewEndTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRescheduleBooking(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReschedule}
                disabled={updateTimesMutation.isPending}
                className="px-5 py-2.5 text-xs font-bold text-white bg-farm-600 hover:bg-farm-700 rounded-xl shadow-md transition-all"
              >
                {updateTimesMutation.isPending ? 'Updating...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
