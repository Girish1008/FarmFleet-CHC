import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Radio,
  FilePlus,
  ClipboardList,
  Wrench,
  Navigation,
  Send,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useI18n } from '../i18n/index.js';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: any;
  highlight?: boolean;
  badge?: string;
  pulse?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role } = useAuth();
  const { t } = useI18n();

  const chcNavItems: NavItem[] = [
    { to: '/chc/dashboard', label: t('chc.dashboard.title'), icon: LayoutDashboard },
    { to: '/chc/bookings', label: t('bookings.title'), icon: ClipboardList },
    {
      to: '/chc/bookings/new',
      label: t('bookings.new.title'),
      icon: FilePlus,
      highlight: true,
      badge: 'Voice AI',
    },
    { to: '/chc/schedule', label: t('schedule.title'), icon: CalendarDays },
    {
      to: '/chc/tracking',
      label: t('chc.actions.liveTracking'),
      icon: Radio,
      pulse: true,
    },
  ];

  const farmerNavItems: NavItem[] = [
    { to: '/farmer/dashboard', label: t('farmer.dashboard.title'), icon: LayoutDashboard },
    {
      to: '/farmer/requests/new',
      label: t('farmer.requests.new.title'),
      icon: Send,
      highlight: true,
    },
    { to: '/farmer/requests', label: t('farmer.requests.title'), icon: ClipboardList },
    { to: '/farmer/bookings', label: t('farmer.bookings.title'), icon: CalendarDays },
  ];

  const operatorNavItems: NavItem[] = [
    { to: '/operator/dashboard', label: t('operator.dashboard.title'), icon: LayoutDashboard },
    {
      to: '/operator/tracking',
      label: t('operator.tracking.title'),
      icon: Radio,
      pulse: true,
      highlight: true,
    },
  ];

  let navItems: NavItem[] = chcNavItems;
  if (role === 'FARMER') navItems = farmerNavItems;
  if (role === 'OPERATOR') navItems = operatorNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        <div className="p-4 space-y-1 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 lg:hidden">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Menu Navigation
            </span>
            <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-farm-600 text-white shadow-md shadow-farm-600/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                          isActive ? 'bg-white/20 text-white' : 'bg-farm-100 text-farm-800'
                        }`}
                      >
                        <Sparkles className="w-3 h-3 mr-0.5" />
                        {item.badge}
                      </span>
                    )}
                    {item.pulse && (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer info badge */}
        <div className="p-4 m-3 bg-gradient-to-br from-slate-50 to-farm-50/50 rounded-2xl border border-slate-200/80">
          <div className="flex items-center space-x-2 text-farm-800 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>CHC Operational Hub</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
            High-contrast outdoor interface configured for rural network reliability.
          </p>
        </div>
      </aside>
    </>
  );
};
