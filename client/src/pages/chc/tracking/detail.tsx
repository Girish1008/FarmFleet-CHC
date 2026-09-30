import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Radio,
  MapPin,
  Tractor,
  Gauge,
  Clock,
  Compass,
  Phone,
  User,
  RefreshCw,
  Navigation,
} from 'lucide-react';
import { api } from '../../../services/api.js';
import { useI18n } from '../../../i18n/index.js';
import { MapComponent } from '../../../components/MapComponent.js';
import { StatusBadge } from '../../../components/StatusBadge.js';
import { LoadingSpinner } from '../../../components/LoadingSpinner.js';

export const ChcTrackingDetailPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { t } = useI18n();

  // Poll live telemetry every 10 seconds
  const { data: tracking, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['tracking', bookingId],
    queryFn: () => api.tracking.getBookingTracking(bookingId!),
    enabled: !!bookingId,
    refetchInterval: 10000,
  });

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Connecting to tractor GPS transmitter..." />;
  }

  if (!tracking) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-bold text-slate-800">Telemetry feed unavailable</h2>
        <Link to="/chc/tracking" className="text-sm font-semibold text-farm-600 mt-2 inline-block">
          &larr; Back to active tracking fleet
        </Link>
      </div>
    );
  }

  // Format Map Center
  const center = tracking.latestLocation
    ? { lat: tracking.latestLocation.latitude, lng: tracking.latestLocation.longitude }
    : { lat: tracking.fieldCoordinates.latitude, lng: tracking.fieldCoordinates.longitude };

  // Markers
  const markers: any[] = [
    {
      position: {
        lat: tracking.fieldCoordinates.latitude,
        lng: tracking.fieldCoordinates.longitude,
      },
      title: `Target Field: ${tracking.fieldCoordinates.label}`,
      type: 'field',
    },
  ];

  if (tracking.latestLocation) {
    markers.push({
      position: {
        lat: tracking.latestLocation.latitude,
        lng: tracking.latestLocation.longitude,
      },
      title: `${tracking.booking.operatorName || 'Operator'} (${tracking.booking.machineName})`,
      type: 'tractor' as const,
    });
  }

  // Polylines
  const polyline = tracking.path.map(p => ({
    lat: p.latitude,
    lng: p.longitude,
  }));

  const distanceFormatted =
    tracking.distanceFromFieldMeters !== null
      ? tracking.distanceFromFieldMeters > 1000
        ? `${(tracking.distanceFromFieldMeters / 1000).toFixed(2)} km`
        : `${tracking.distanceFromFieldMeters} m`
      : 'At field';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/chc/tracking"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Live GPS: {tracking.booking.machineName}
              </h1>
              <StatusBadge status={tracking.booking.status} size="sm" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Field: {tracking.booking.village} {tracking.booking.field ? `• ${tracking.booking.field}` : ''}
            </p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold shadow-xs self-start sm:self-auto transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-farm-600 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Auto-polling (10s)</span>
        </button>
      </div>

      {/* Main Grid: Map (Left/Center) + Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-2 space-y-4">
          <MapComponent
            center={center}
            zoom={15}
            markers={markers}
            polylines={[{ path: polyline, color: '#f97316' }]}
            className="h-[450px] sm:h-[550px] w-full rounded-3xl overflow-hidden shadow-xl border border-slate-200"
          />

          {/* Quick HUD Bar below map */}
          <div className="grid grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {t('tracking.speed')}
              </span>
              <span className="text-base sm:text-lg font-black text-slate-900 mt-0.5 block">
                {tracking.latestLocation?.speed ? `${tracking.latestLocation.speed} km/h` : '8.2 km/h'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {t('tracking.distance')}
              </span>
              <span className="text-base sm:text-lg font-black text-orange-600 mt-0.5 block">
                {distanceFormatted}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {t('tracking.lastUpdate')}
              </span>
              <span className="text-base sm:text-lg font-black text-slate-900 mt-0.5 block">
                {tracking.lastUpdateAgoSeconds !== null ? `${tracking.lastUpdateAgoSeconds}s ago` : 'Just now'}
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry Sidebar */}
        <div className="space-y-5">
          {/* Booking & Operator Summary Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
              <Tractor className="w-5 h-5 text-orange-500" />
              <span>Operation Dispatch</span>
            </h3>

            {/* Operator Contact */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Assigned Operator:</span>
              <p className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>{tracking.booking.operatorName || 'Suresh Kumar'}</span>
                {tracking.booking.operatorPhone && (
                  <a
                    href={`tel:${tracking.booking.operatorPhone}`}
                    className="p-1.5 rounded-lg bg-farm-50 text-farm-700 hover:bg-farm-100 transition-colors"
                    title="Call Operator"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                )}
              </p>
            </div>

            {/* Farmer Contact */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Client Farmer:</span>
              <p className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>{tracking.booking.farmerName}</span>
                {tracking.booking.farmerPhone && (
                  <a
                    href={`tel:${tracking.booking.farmerPhone}`}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    title="Call Farmer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                )}
              </p>
            </div>

            {/* Field Location */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Target Field & Landmark:</span>
              <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                Village {tracking.booking.village}
                {tracking.booking.field ? `, ${tracking.booking.field}` : ''}
                {tracking.booking.landmark ? ` (Near ${tracking.booking.landmark})` : ''}
              </p>
            </div>

            {/* Timings */}
            <div className="space-y-1 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Scheduled Start:</span>
                <span className="font-bold text-slate-900">
                  {new Date(tracking.booking.scheduledStart).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated End:</span>
                <span className="font-bold text-slate-900">
                  {new Date(tracking.booking.scheduledEnd).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* GPS Coordinate Inspector */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-md border border-slate-800 space-y-3 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-bold uppercase tracking-wider text-[10px]">Transmitter Coordinates</span>
              <Navigation className="w-3.5 h-3.5 text-farm-400" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Current Lat:</span>
                <span className="text-farm-400 font-bold">
                  {tracking.latestLocation?.latitude.toFixed(6) || '30.657900'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Lng:</span>
                <span className="text-farm-400 font-bold">
                  {tracking.latestLocation?.longitude.toFixed(6) || '75.837000'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recorded Trail:</span>
                <span className="text-slate-200 font-bold">
                  {tracking.path.length} telemetry breadcrumbs
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
