import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Radio,
  Tractor,
  MapPin,
  Play,
  Square,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Compass,
  Gauge,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useI18n } from '../../i18n/index.js';
import { LoadingSpinner } from '../../components/LoadingSpinner.js';
import { ErrorBanner } from '../../components/ErrorBanner.js';
import { SuccessToast } from '../../components/SuccessToast.js';

export const OperatorTrackingPage: React.FC = () => {
  const { t } = useI18n();

  const [isTracking, setIsTracking] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number; speed?: number | null } | null>(null);
  const [pingCount, setPingCount] = useState(0);
  const [useSimulation, setUseSimulation] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const intervalRef = useRef<any>(null);

  // Check active job
  const { data: activeJob, isLoading: jobLoading } = useQuery({
    queryKey: ['operatorActiveJob'],
    queryFn: () => api.operator.getActiveJob(),
    refetchInterval: 10000,
  });

  // Location mutation
  const locationMutation = useMutation({
    mutationFn: (payload: { bookingId: string; latitude: number; longitude: number; speed?: number }) =>
      api.operator.recordLocation(payload),
    onSuccess: () => {
      setPingCount(prev => prev + 1);
    },
    onError: (err: any) => {
      console.error('GPS transmission error:', err);
    },
  });

  // Simulated GPS generator around Sultanpur fields (~30.655, 75.834)
  const simulatedCoordsRef = useRef({ lat: 30.6548, lng: 75.8342 });

  const transmitLocation = () => {
    if (!activeJob) return;

    if (useSimulation || !navigator.geolocation) {
      // Simulate tractor movement (ploughing forward in field)
      simulatedCoordsRef.current = {
        lat: simulatedCoordsRef.current.lat + (Math.random() * 0.0004 - 0.0001),
        lng: simulatedCoordsRef.current.lng + (Math.random() * 0.0004 - 0.0001),
      };
      const speed = parseFloat((7.5 + Math.random() * 2).toFixed(1));
      setLastCoords({
        lat: simulatedCoordsRef.current.lat,
        lng: simulatedCoordsRef.current.lng,
        speed,
      });

      locationMutation.mutate({
        bookingId: activeJob.id,
        latitude: simulatedCoordsRef.current.lat,
        longitude: simulatedCoordsRef.current.lng,
        speed,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude, speed } = pos.coords;
        setLastCoords({ lat: latitude, lng: longitude, speed: speed ? speed * 3.6 : 8.0 });
        setGeoError(null);

        locationMutation.mutate({
          bookingId: activeJob.id,
          latitude,
          longitude,
          speed: speed ? Math.round(speed * 3.6) : 8,
        });
      },
      err => {
        console.warn('Geolocation error:', err.message);
        setGeoError(`GPS sensor alert: ${err.message}. Switching to test simulation mode.`);
        setUseSimulation(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      }
    );
  };

  const startTracking = () => {
    if (!activeJob) return;
    setGeoError(null);
    setIsTracking(true);
    setToastMessage('GPS transmitter initialized: broadcasting every 5 seconds to CHC');

    // Transmit immediately
    transmitLocation();

    // Set interval every 5 seconds
    intervalRef.current = setInterval(() => {
      transmitLocation();
    }, 5000);
  };

  const stopTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTracking(false);
    setToastMessage('Location tracking paused.');
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (jobLoading) {
    return <LoadingSpinner size="lg" text="Checking active tractor job assignment..." />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {toastMessage && (
        <SuccessToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}
      {geoError && <ErrorBanner message={geoError} onDismiss={() => setGeoError(null)} />}

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {t('operator.tracking.title')}
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Broadcast your tractor GPS telemetry directly to the Custom Hiring Centre dashboard.
        </p>
      </div>

      {!activeJob ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-xs space-y-3">
          <Tractor className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">No In-Progress Job Found</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You must first click "Start Field Operation" on an assigned job in your dashboard before starting live GPS tracking.
          </p>
          <Link
            to="/operator/dashboard"
            className="inline-block mt-3 px-5 py-2.5 bg-farm-600 hover:bg-farm-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            Go to Assigned Jobs Dashboard &rarr;
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Active Job Summary Header */}
          <div className="p-6 bg-slate-900 text-white space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Active Operation Target
              </span>
              <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Job #{activeJob.id}
              </span>
            </div>

            <div>
              <h2 className="text-xl font-black">{activeJob.machine?.name}</h2>
              <p className="text-xs text-slate-400 mt-1">
                Field: {activeJob.locationVillage} {activeJob.locationField ? `• ${activeJob.locationField}` : ''}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs text-slate-300">
              <div>
                <span className="text-slate-500 block">Farmer:</span>
                <span className="font-bold text-white">{activeJob.farmer?.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Area & Crop:</span>
                <span className="font-bold text-white">
                  {activeJob.areaInAcres} Acres ({activeJob.cropType || 'Crop'})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Pings Sent:</span>
                <span className="font-bold text-farm-400">{pingCount} telemetries</span>
              </div>
            </div>
          </div>

          {/* Tracking Controls & Live HUD */}
          <div className="p-6 sm:p-8 space-y-6">
            {isTracking ? (
              <div className="p-5 rounded-2xl bg-orange-50 border-2 border-orange-400 text-orange-950 space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="relative flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-orange-600"></span>
                  </span>
                  <p className="text-sm font-black">
                    {t('operator.tracking.activeAlert')}
                  </p>
                </div>

                {lastCoords && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-white/80 p-3 rounded-xl border border-orange-200">
                    <div>
                      <span className="text-slate-400 block font-medium">Latitude:</span>
                      <span className="font-mono font-bold text-slate-900">{lastCoords.lat.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Longitude:</span>
                      <span className="font-mono font-bold text-slate-900">{lastCoords.lng.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Speed:</span>
                      <span className="font-mono font-bold text-orange-600">
                        {lastCoords.speed ? `${lastCoords.speed} km/h` : '8.0 km/h'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs leading-relaxed space-y-2">
                <p className="font-bold text-slate-900">
                  Ready to broadcast tractor coordinates to CHC dispatch.
                </p>
                <p>
                  Press the button below to enable mobile GPS broadcasting. The browser may prompt you to allow location access.
                </p>
              </div>
            )}

            {/* Main Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {!isTracking ? (
                <button
                  type="button"
                  onClick={startTracking}
                  className="w-full py-4 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-base shadow-xl shadow-orange-600/30 flex items-center justify-center space-x-2.5 transition-all hover:scale-[1.02]"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>{t('operator.tracking.start')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopTracking}
                  className="w-full py-4 px-6 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-base shadow-xl flex items-center justify-center space-x-2.5 transition-all"
                >
                  <Square className="w-5 h-5 fill-white" />
                  <span>{t('operator.tracking.stop')}</span>
                </button>
              )}
            </div>

            {/* Test Simulation Switcher */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span>Laptop / Desktop Demo Simulation Mode</span>
              </span>
              <button
                type="button"
                onClick={() => setUseSimulation(!useSimulation)}
                className={`px-3 py-1 rounded-lg font-bold border transition-colors ${
                  useSimulation
                    ? 'bg-orange-100 text-orange-900 border-orange-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {useSimulation ? 'Active (Simulated Punjab Fields)' : 'Off (Use Native GPS)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
