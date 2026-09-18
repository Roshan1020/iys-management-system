import React, { useState } from 'react';
import { useCentres } from '../../hooks/useCentres';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CreateCentreModal } from './CreateCentreModal';
import { Building2, Plus, MapPin, Mail, Phone, CheckCircle } from 'lucide-react';

export const CentresListPage: React.FC = () => {
  const { user, hasRole, activeCentreId, setActiveCentreId } = useAuth();
  const isSuperAdmin = hasRole('SUPER_ADMIN');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: pageData, isLoading, isError } = useCentres(false, 0, 50);
  const allCentres = pageData?.content || [];
  
  // For non-super admins (like CENTRE_ADMIN), only belonged centre is visible
  const centres = isSuperAdmin
    ? allCentres
    : allCentres.filter((c) => c.id === (user?.centreId || activeCentreId));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>{isSuperAdmin ? 'Multi-Centre Administration' : 'Assigned Centre Profile'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-heading">
            {isSuperAdmin ? 'Centre Locations' : 'My Centre'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSuperAdmin
              ? 'Manage global ISKCON youth centre chapters and configure active operational contexts.'
              : 'Operational details and configuration for your assigned youth centre chapter.'}
          </p>
        </div>

        {isSuperAdmin && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Centre
          </Button>
        )}
      </div>

      {/* Grid of Centres */}
      {isLoading ? (
        <div className="py-20 bg-white rounded-3xl border border-slate-200/80">
          <LoadingSpinner message="Loading registered centre locations..." />
        </div>
      ) : isError ? (
        <div className="p-8 bg-rose-50 text-rose-700 text-xs font-semibold rounded-2xl border border-rose-200">
          Failed to load centres list. Verify your network or administrator privileges.
        </div>
      ) : centres.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">
            {isSuperAdmin ? 'No Centres Registered Yet' : 'No Assigned Centre Found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isSuperAdmin
              ? 'Click "Add New Centre" to register the first youth centre.'
              : 'Contact your Super Administrator to link your account to an active youth centre.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {centres.map((centre) => {
            const isSelected = centre.id === activeCentreId;

            return (
              <div
                key={centre.id}
                className={`rounded-3xl p-6 transition-all duration-200 border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-amber-500/10 via-white to-white border-amber-400 shadow-md ring-2 ring-amber-400/30'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 font-extrabold text-sm flex items-center justify-center shadow-xs">
                      {centre.shortCode}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={(centre.isActive ?? centre.active ?? true) ? 'emerald' : 'slate'} size="sm">
                        {(centre.isActive ?? centre.active ?? true) ? 'Active' : 'Inactive'}
                      </Badge>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Current
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    {centre.name}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {centre.city}, {centre.country}
                      </span>
                    </div>

                    {centre.contactEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{centre.contactEmail}</span>
                      </div>
                    )}

                    {centre.contactPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{centre.contactPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {centre.id.substring(0, 8)}...
                  </span>
                  {isSuperAdmin ? (
                    <Button
                      variant={isSelected ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setActiveCentreId(centre.id)}
                    >
                      {isSelected ? 'Selected' : 'Switch to Centre'}
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Assigned Centre
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateCentreModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
