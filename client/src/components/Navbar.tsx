import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Tractor,
  Bell,
  Globe,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Radio,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useI18n } from '../i18n/index.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, role, logout } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showNotifications, setShowNotifications] = useState(false);

  // Poll farmer notifications if user is farmer
  const { data: notifData } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => api.farmer.getNotifications(),
    enabled: role === 'FARMER' || role === 'ADMIN',
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.farmer.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifData?.unreadCount || 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile menu toggle + Brand Logo */}
          <div className="flex items-center space-x-3">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
                aria-label="Toggle Navigation Drawer"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}

            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-farm-700 via-farm-600 to-farm-500 flex items-center justify-center shadow-md shadow-farm-600/25 group-hover:scale-105 transition-transform">
                <Tractor className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900">
                  Farm<span className="text-farm-600">Fleet</span>
                </span>
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-farm-100 text-farm-800">
                  CHC India
                </span>
              </div>
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  language === 'en'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  language === 'hi'
                    ? 'bg-white text-farm-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Switch to Hindi (हिन्दी)"
              >
                हिन्दी
              </button>
              <button
                onClick={() => setLanguage('ta')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  language === 'ta'
                    ? 'bg-white text-farm-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Switch to Tamil (தமிழ்)"
              >
                தமிழ்
              </button>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-[10px] font-black text-white bg-red-600 rounded-full border-2 border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-farm-600" />
                      <h4 className="font-bold text-sm text-slate-900">{t('farmer.notifications.title')}</h4>
                    </div>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-farm-100 text-farm-800 font-bold px-2 py-0.5 rounded-full">
                        {unreadCount} {t('farmer.notifications.unread')}
                      </span>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifData?.data && notifData.data.length > 0 ? (
                      notifData.data.map(n => (
                        <div
                          key={n.id}
                          className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start justify-between space-x-2 ${
                            !n.read ? 'bg-farm-50/50' : ''
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900">{n.title}</p>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {!n.read && (
                            <button
                              onClick={() => markReadMutation.mutate(n.id)}
                              className="text-farm-600 hover:text-farm-800 p-1 flex-shrink-0"
                              title="Mark read"
                            >
                              <CheckCheck className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No notifications at this time
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Role Info */}
            {user && (
              <div className="flex items-center space-x-3 border-l border-slate-200 pl-3 sm:pl-4">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900 leading-tight">{user.name}</span>
                  <span className="text-[11px] font-semibold text-farm-600 leading-tight">
                    {t(`role.${user.role}` as any, user.role)}
                  </span>
                </div>

                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm">
                  {user.name.charAt(0)}
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title={t('common.logout')}
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
