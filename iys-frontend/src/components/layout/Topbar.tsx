import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCentres } from '../../hooks/useCentres';
import { Building2, User, ChevronRight, Menu } from 'lucide-react';

interface TopbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, activeCentreId, setActiveCentreId, hasRole } = useAuth();
  const isSuperAdmin = hasRole('SUPER_ADMIN');
  const { data: centresData } = useCentres(false, 0, 50);

  // For non-super admins, ensure active centre is always their assigned centre
  React.useEffect(() => {
    if (!isSuperAdmin && user?.centreId && activeCentreId !== user.centreId) {
      setActiveCentreId(user.centreId);
    }
  }, [isSuperAdmin, user?.centreId, activeCentreId, setActiveCentreId]);

  const activeCentre = centresData?.content?.find((c) => c.id === (activeCentreId || user?.centreId))
    || centresData?.content?.[0];

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left controls: Small arrow / menu toggle for mobile phone view */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-colors cursor-pointer shrink-0"
          title={isSidebarOpen ? 'Close Navigation' : 'Open Navigation'}
          aria-label="Toggle navigation bar"
        >
          <Menu className="w-4 h-4 text-amber-700" />
          <ChevronRight className={`w-3.5 h-3.5 text-amber-600 transition-transform duration-200 ${isSidebarOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Centre Selector / Assigned Centre Display */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs font-medium min-w-0">
          <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="hidden sm:inline font-semibold text-slate-700 shrink-0">Centre:</span>
          {isSuperAdmin && centresData?.content && centresData.content.length > 1 ? (
            <select
              value={activeCentreId || ''}
              onChange={(e) => setActiveCentreId(e.target.value)}
              className="bg-transparent font-bold text-amber-900 focus:outline-none cursor-pointer truncate text-[11px] sm:text-xs max-w-[140px] sm:max-w-[200px]"
            >
              {centresData.content.map((c) => (
                <option key={c.id} value={c.id} className="bg-white text-slate-900">
                  {c.shortCode} - {c.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-amber-900 truncate text-[11px] sm:text-xs">
                {activeCentre ? `${activeCentre.shortCode} - ${activeCentre.name}` : 'Assigned Centre'}
              </span>
              {!isSuperAdmin && (
                <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200/80 text-amber-800 shrink-0">
                  Your Centre
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* User Card */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-white shrink-0">
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[130px]">
              {user?.email.split('@')[0]}
            </p>
            <p className="text-[10px] text-amber-600 font-medium leading-tight mt-0.5">
              {user?.roles?.[0]?.replace('ROLE_', '') || 'Member'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
