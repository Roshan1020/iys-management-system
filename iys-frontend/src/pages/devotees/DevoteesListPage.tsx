import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDevotees } from '../../hooks/useDevotees';
import { useCentres } from '../../hooks/useCentres';
import { ProfileType } from '../../types/devotee';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CreateDevoteeModal } from './CreateDevoteeModal';
import { DevoteeDetailModal } from './DevoteeDetailModal';
import {
  Users,
  Search,
  UserPlus,
  Eye,
  Building2,
  Sparkles,
} from 'lucide-react';

export const DevoteesListPage: React.FC = () => {
  const { activeCentreId, hasAnyRole } = useAuth();
  const { data: centresData } = useCentres(false, 0, 100);
  const centres = centresData?.content || [];

  const [selectedCentreId, setSelectedCentreId] = useState<string>('');
  const effectiveCentreId = selectedCentreId !== '' ? selectedCentreId : (activeCentreId || '');

  const [selectedProfileType, setSelectedProfileType] = useState<ProfileType | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDevoteeId, setSelectedDevoteeId] = useState<string | null>(null);

  const { data: pageData, isLoading, isError } = useDevotees({
    centreId: effectiveCentreId || undefined,
    profileType: selectedProfileType,
    search: search ? search.trim() : undefined,
    page,
    size: 15,
  });

  const devotees = pageData?.content || [];

  const profileTypeTabs: { label: string; value: ProfileType | undefined }[] = [
    { label: 'All Devotees', value: undefined },
    { label: 'Students', value: 'STUDENT' },
    { label: 'Professionals', value: 'WORKING_PROFESSIONAL' },
    { label: 'Alumni', value: 'ALUMNI' },
    { label: 'General / Other', value: 'OTHER' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Devotee Management</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-heading">Devotee Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage profiles, initiate counselling records, and monitor youth devotees.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Centre Switcher */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs">
            <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
            <select
              value={selectedCentreId || activeCentreId || ''}
              onChange={(e) => {
                setSelectedCentreId(e.target.value);
                setPage(0);
              }}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer pr-1"
            >
              {hasAnyRole(['SUPER_ADMIN']) && <option value="">🌐 All Centres (Global View)</option>}
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.shortCode})
                </option>
              ))}
            </select>
          </div>

          {hasAnyRole(['CENTRE_ADMIN', 'SUPER_ADMIN']) && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Register Devotee
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Profile Type Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
            {profileTypeTabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => {
                  setSelectedProfileType(tab.value);
                  setPage(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedProfileType === tab.value
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16">
            <LoadingSpinner message="Fetching devotees from database..." />
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-rose-600 text-xs font-semibold">
            Unable to fetch devotees. Make sure your active centre is selected and backend is reachable.
          </div>
        ) : devotees.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Devotees Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No devotees match your filter or search query in this centre. Click "Register Devotee" to add one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Devotee</th>
                  <th className="py-3.5 px-4">Profile Type</th>
                  <th className="py-3.5 px-4">Initiation Status</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {devotees.map((devotee) => (
                  <tr key={devotee.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {devotee.initiatedName?.[0] || devotee.legalName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {devotee.initiatedName || devotee.legalName}
                          </p>
                          {devotee.initiatedName && (
                            <p className="text-[11px] text-slate-500">Legal: {devotee.legalName}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <Badge
                        variant={
                          devotee.profileType === 'STUDENT'
                            ? 'amber'
                            : devotee.profileType === 'WORKING_PROFESSIONAL'
                            ? 'blue'
                            : devotee.profileType === 'ALUMNI'
                            ? 'purple'
                            : 'slate'
                        }
                      >
                        {devotee.profileType?.replace('_', ' ')}
                      </Badge>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        {devotee.initiationStatus || 'UNINITIATED'}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-slate-600">
                      {devotee.city || 'Not specified'}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDevoteeId(devotee.id)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        View Profile
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pageData && pageData.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <span>
              Page {pageData.pageNumber + 1} of {pageData.totalPages} ({pageData.totalElements} devotees)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pageData.last}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateDevoteeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        centreId={effectiveCentreId || centres[0]?.id || ''}
      />

      <DevoteeDetailModal
        isOpen={!!selectedDevoteeId}
        devoteeId={selectedDevoteeId}
        onClose={() => setSelectedDevoteeId(null)}
      />
    </div>
  );
};
