import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tractor, Lock, Phone, User as UserIcon, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useI18n } from '../i18n/index.js';
import { Role } from '../types/index.js';
import { ErrorBanner } from '../components/ErrorBanner.js';

export const LoginPage: React.FC = () => {
  const { login, quickLoginAsRole } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('manager@farmfleet.in');
  const [password, setPassword] = useState('Manager@123');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectByRole = (userRole: Role) => {
    if (userRole === 'ADMIN' || userRole === 'CHC_MANAGER') {
      navigate('/chc/dashboard');
    } else if (userRole === 'OPERATOR') {
      navigate('/operator/dashboard');
    } else if (userRole === 'FARMER') {
      navigate('/farmer/dashboard');
    } else {
      navigate('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await login(identifier, password);
      redirectByRole(user.role);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || t('login.error')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (role: Role) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await quickLoginAsRole(role);
      redirectByRole(user.role);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-farm-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-farm-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

      {/* Language Switcher in top right */}
      <div className="absolute top-6 right-6 flex items-center bg-slate-800/80 backdrop-blur-md p-1 rounded-xl border border-slate-700">
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
            language === 'en' ? 'bg-farm-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          English
        </button>
        <button
          onClick={() => setLanguage('hi')}
          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
            language === 'hi' ? 'bg-farm-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          हिन्दी
        </button>
        <button
          onClick={() => setLanguage('ta')}
          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
            language === 'ta' ? 'bg-farm-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          தமிழ்
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Brand Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-farm-600 to-farm-400 flex items-center justify-center shadow-xl shadow-farm-600/30 mb-4 transform hover:scale-105 transition-transform">
            <Tractor className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Farm<span className="text-farm-400">Fleet</span>
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-400">
            {t('login.subtitle')}
          </p>
        </div>

        {/* Card Form */}
        <div className="mt-8 bg-white/95 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-200">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">{t('login.title')}</h2>
            <p className="text-xs text-slate-500 mt-1">
              High-contrast access for Custom Hiring Centre managers, operators, and farmers.
            </p>
          </div>

          {error && (
            <div className="mb-5">
              <ErrorBanner message={error} onDismiss={() => setError(null)} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t('login.identifier')}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder={t('login.identifier.placeholder')}
                  className="block w-full pl-10 pr-3.5 py-3 text-sm font-medium border border-slate-300 rounded-xl focus:ring-3 focus:ring-farm-600 focus:border-farm-600 bg-slate-50 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t('login.password')}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-3 text-sm font-medium border border-slate-300 rounded-xl focus:ring-3 focus:ring-farm-600 focus:border-farm-600 bg-slate-50 text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center space-x-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-farm-600/30 text-sm font-bold text-white bg-farm-600 hover:bg-farm-700 focus:outline-none focus:ring-3 focus:ring-offset-2 focus:ring-farm-500 transition-all disabled:opacity-50"
            >
              <span>{isSubmitting ? t('login.submitting') : t('login.submit')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Role Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{t('login.quickRoles')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('CHC_MANAGER')}
                className="p-2.5 bg-farm-50 hover:bg-farm-100 text-farm-900 font-bold rounded-xl border border-farm-200 text-left transition-colors flex items-center justify-between"
              >
                <span>CHC Manager</span>
                <span className="text-[10px] text-farm-600">Ramesh</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('FARMER')}
                className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold rounded-xl border border-blue-200 text-left transition-colors flex items-center justify-between"
              >
                <span>Farmer</span>
                <span className="text-[10px] text-blue-600">Rajesh</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('OPERATOR')}
                className="p-2.5 bg-orange-50 hover:bg-orange-100 text-orange-900 font-bold rounded-xl border border-orange-200 text-left transition-colors flex items-center justify-between"
              >
                <span>Operator</span>
                <span className="text-[10px] text-orange-600">Suresh</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ADMIN')}
                className="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold rounded-xl border border-purple-200 text-left transition-colors flex items-center justify-between"
              >
                <span>Admin</span>
                <span className="text-[10px] text-purple-600">Gurpreet</span>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          FarmFleet Custom Hiring Centre Logistics System • Ministry of Agriculture CHC Integration
        </p>
      </div>
    </div>
  );
};
