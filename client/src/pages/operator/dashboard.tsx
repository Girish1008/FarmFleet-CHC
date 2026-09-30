import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Tractor,
  Radio,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  ArrowRight,
  User,
  Phone,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useI18n } from '../../i18n/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import { LoadingSpinner } from '../../components/LoadingSpinner.js';

export const OperatorDashboardPage: React.FC = () => {
  const { t } = useI18n();
  const { user } = useAuth();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['operatorTasks'],
    queryFn: () => api.operator.getTasks(),
  });

  const { data: activeJob } = useQuery({
    queryKey: ['operatorActiveJob'],
    queryFn: () => api.operator.getActiveJob(),
    refetchInterval: 10000,
  });

  const taskList = tasks || [];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-black uppercase tracking-wider bg-white/20 text-orange-100 px-3 py-1 rounded-full inline-block mb-3">
            Tractor Operator Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome, {user?.name || 'Operator'}
          </h1>
          <p className="text-xs sm:text-sm text-orange-100 mt-2 max-w-xl leading-relaxed">
            Execute scheduled machinery field assignments and stream live GPS telemetry back to CHC dispatch.
          </p>
        </div>

        <Link
          to="/operator/tracking"
          className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm shadow-xl flex items-center justify-center space-x-2.5 transition-all hover:scale-105 self-start md:self-auto"
        >
          <Radio className="w-5 h-5 text-orange-400 animate-pulse" />
          <span>Launch GPS Tracker</span>
        </Link>
      </div>

      {/* Active Job Alert Pill */}
      {activeJob && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Currently Active Operation
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                {activeJob.machine?.name} at Village {activeJob.locationVillage} ({activeJob.farmer?.name})
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              to="/operator/tracking"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Broadcast GPS</span>
            </Link>
            <Link
              to={`/operator/jobs/${activeJob.id}`}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md"
            >
              Manage Job
            </Link>
          </div>
        </div>
      )}

      {/* Assigned Tasks List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">{t('operator.todayTasks')}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Scheduled tractor and implement dispatches assigned to your shift
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {taskList.length} Jobs
          </span>
        </div>

        {isLoading ? (
          <LoadingSpinner text="Fetching operator assignments..." />
        ) : taskList.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No machinery jobs currently assigned to your profile today.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {taskList.map(job => (
              <div
                key={job.id}
                className="p-5 sm:p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-slate-400">JOB #{job.id}</span>
                    <StatusBadge status={job.status} size="sm" />
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    {job.machine?.name} ({job.areaInAcres} Acres • {job.cropType || 'Crop'})
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Farmer: <strong>{job.farmer?.name}</strong></span>
                    </span>

                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-farm-600" />
                      <span>{job.locationVillage} {job.locationField ? `• ${job.locationField}` : ''}</span>
                    </span>

                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {new Date(job.scheduledStart).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(job.scheduledEnd).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </span>
                  </div>
                </div>

                <Link
                  to={`/operator/jobs/${job.id}`}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center space-x-1.5 self-start sm:self-center"
                >
                  <span>Job Details & Status</span>
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
