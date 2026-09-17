import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  ShieldCheck,
  UserCheck,
  Sparkles,
  LogOut,
  ChevronLeft,
  Crown,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Badge } from '../common/Badge';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout, hasAnyRole } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: ['DEVOTEE', 'COUNSELLOR', 'CENTRE_ADMIN', 'SUPER_ADMIN', 'YOUTH_MEMBER', 'MENTOR'],
    },
    {
      label: 'Devotee Directory',
      path: '/devotees',
      icon: Users,
      roles: ['COUNSELLOR', 'CENTRE_ADMIN', 'SUPER_ADMIN'],
    },
    {
      label: 'Centres',
      path: '/centres',
      icon: Building2,
      roles: ['SUPER_ADMIN', 'CENTRE_ADMIN'],
    },
    {
      label: 'Users & RBAC',
      path: '/users',
      icon: ShieldCheck,
      roles: ['SUPER_ADMIN', 'CENTRE_ADMIN'],
    },
    {
      label: 'Super Admin Hub',
      path: '/super-admin',
      icon: Crown,
      roles: ['SUPER_ADMIN'],
    },
    {
      label: 'My Profile',
      path: '/profile',
      icon: UserCheck,
      roles: ['DEVOTEE', 'COUNSELLOR', 'CENTRE_ADMIN', 'SUPER_ADMIN', 'YOUTH_MEMBER', 'MENTOR'],
    },
  ];

  return (
    <aside
      className={clsx(
        'w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 border-r border-slate-800 min-h-screen',
        'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none',
        'lg:static lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Brand Header with Close Arrow */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-xl shadow-lg shadow-orange-500/20 ring-1 ring-amber-400/40">
            🪷
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white font-heading">
              ISKCON Youth
            </h1>
            <p className="text-[11px] text-amber-400 font-medium tracking-wider uppercase">
              Services Portal
            </p>
          </div>
        </div>

        {/* Small arrow to close / collapse sidebar on phone/mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close Sidebar"
          aria-label="Close sidebar"
        >
          <ChevronLeft className="w-5 h-5 text-amber-400" />
        </button>
      </div>

      {/* Devotee Info Snippet */}
      <div className="px-5 py-3.5 border-b border-slate-800/60 bg-slate-950/40">
        <p className="text-xs text-slate-400">Signed in as:</p>
        <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">{user?.email}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {user?.roles?.slice(0, 2).map((role) => (
            <Badge
              key={role}
              variant="amber"
              size="sm"
              className="text-[10px] py-0 px-1.5 bg-amber-950/60 text-amber-300 border-amber-800/60"
            >
              {role.replace('ROLE_', '')}
            </Badge>
          ))}
          {(user?.roles?.length || 0) > 2 && (
            <span className="text-[10px] text-slate-400 self-center">
              +{(user?.roles?.length || 0) - 2}
            </span>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Main Navigation
        </div>

        {navItems.map((item) => {
          const isAllowed = !item.roles || hasAnyRole(item.roles);
          if (!isAllowed) return null;

          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold shadow-md shadow-orange-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Daily Spiritual Inspiration */}
      <div className="p-3.5 m-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
        <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Maha Mantra</span>
        </div>
        <p className="text-[11px] text-slate-300 italic leading-relaxed">
          "Hare Krishna, Hare Rama, Chanting brings supreme peace."
        </p>
      </div>

      {/* Sign Out Button */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={() => {
            onClose();
            logout();
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
