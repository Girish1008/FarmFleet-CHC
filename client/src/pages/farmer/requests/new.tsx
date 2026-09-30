import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  Tractor,
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../../services/api.js';
import { useI18n } from '../../../i18n/index.js';
import { ErrorBanner } from '../../../components/ErrorBanner.js';
import { SuccessToast } from '../../../components/SuccessToast.js';

export const NewFarmerRequestPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [requestedMachineType, setRequestedMachineType] = useState('TRACTOR');
  const [areaInAcres, setAreaInAcres] = useState<number>(5.0);
  const [cropType, setCropType] = useState('Wheat');
  const [preferredDate, setPreferredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [locationVillage, setLocationVillage] = useState('Sultanpur');
  const [locationField, setLocationField] = useState('North Acreage Plot');
  const [locationLandmark, setLocationLandmark] = useState('Near Primary School');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const createRequestMutation = useMutation({
    mutationFn: (payload: any) => api.farmer.createRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmerRequests'] });
      setToastMessage('Machinery request submitted successfully to CHC manager!');
      setTimeout(() => navigate('/farmer/requests'), 1000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || 'Failed to submit request');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    createRequestMutation.mutate({
      requestedMachineType,
      areaInAcres: Number(areaInAcres),
      cropType,
      preferredDate: new Date(preferredDate).toISOString(),
      locationVillage,
      locationField,
      locationLandmark,
      specialInstructions,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/farmer/requests')}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t('farmer.requests.new.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('farmer.requests.new.subtitle')}
          </p>
        </div>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      {toastMessage && (
        <SuccessToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Requested Machine Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Required Machinery Type *
            </label>
            <div className="relative">
              <Tractor className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                required
                value={requestedMachineType}
                onChange={e => setRequestedMachineType(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-farm-600 focus:bg-white text-slate-900 font-bold"
              >
                <option value="TRACTOR">Tractor (50+ HP Heavy Duty)</option>
                <option value="ROTAVATOR">Rotavator (Heavy Pulverizer)</option>
                <option value="SEEDER">Super Seeder / Happy Seeder</option>
                <option value="HARVESTER">Combine Harvester (Grain)</option>
                <option value="SPRAYER">High-Pressure Orchard Sprayer</option>
              </select>
            </div>
          </div>

          {/* Area in Acres */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Field Area in Acres *
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              required
              value={areaInAcres}
              onChange={e => setAreaInAcres(parseFloat(e.target.value) || 1)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-farm-600 focus:bg-white text-slate-900 font-bold"
            />
          </div>

          {/* Crop Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Crop Type
            </label>
            <select
              value={cropType}
              onChange={e => setCropType(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-farm-600 focus:bg-white text-slate-900 font-medium"
            >
              <option value="Wheat">Wheat (गेहूं)</option>
              <option value="Paddy">Paddy / Rice (धान)</option>
              <option value="Mustard">Mustard (सरसों)</option>
              <option value="Cotton">Cotton (कपास)</option>
              <option value="Sugarcane">Sugarcane (गन्ना)</option>
              <option value="Maize">Maize (मक्का)</option>
            </select>
          </div>

          {/* Preferred Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Preferred Date of Operation *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                required
                value={preferredDate}
                onChange={e => setPreferredDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-farm-600 focus:bg-white text-slate-900 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center space-x-1.5">
            <MapPin className="w-4 h-4 text-farm-600" />
            <span>Farm Field Location</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Village *
              </label>
              <input
                type="text"
                required
                value={locationVillage}
                onChange={e => setLocationVillage(e.target.value)}
                placeholder="e.g. Sultanpur"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-farm-600 focus:bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Field Plot / Khasra No.
              </label>
              <input
                type="text"
                value={locationField}
                onChange={e => setLocationField(e.target.value)}
                placeholder="e.g. Plot 18B"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-farm-600 focus:bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Nearby Landmark
              </label>
              <input
                type="text"
                value={locationLandmark}
                onChange={e => setLocationLandmark(e.target.value)}
                placeholder="e.g. Near Water Tank"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-farm-600 focus:bg-white text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Special Field Notes / Soil Requirements
          </label>
          <textarea
            rows={3}
            value={specialInstructions}
            onChange={e => setSpecialInstructions(e.target.value)}
            placeholder="e.g., Heavy paddy stubble present, fine tilth required, urgent before upcoming rainfall..."
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-farm-600 focus:bg-white text-slate-900"
          />
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/farmer/requests')}
            className="px-5 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={createRequestMutation.isPending}
            className="px-6 py-3 text-sm font-bold text-white bg-farm-600 hover:bg-farm-700 rounded-xl shadow-lg shadow-farm-600/30 transition-all hover:scale-[1.02] flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>
              {createRequestMutation.isPending ? t('common.loading') : 'Submit Request to CHC'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
