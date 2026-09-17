import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUsersByCentre, useUpdateUserStatus } from '../../hooks/useUsers';
import { UserStatus } from '../../types/user';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AssignRoleModal } from './AssignRoleModal';
import { ShieldCheck, Mail, Phone, Calendar, UserCheck } from 'lucide-react';

export const UsersListPage: React.FC = () => {
  const { activeCentreId, hasAnyRole } = useAuth();
  const [statusFilter, setStatusFilter] = useState<UserStatus | undefined>(undefined);
  const [selectedUserForRole, setSelectedUserForRole] = useState<{ id: string; email: string } | null>(null);

  const { data: pageData, isLoading, isError } = useUsersByCentre(
    activeCentreId || undefined,
    statusFilter,
    0,
    50
  );

  const statusMutation = useUpdateUserStatus();
  const users = pageData?.content || [];

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    try {
      await statusMutation.mutateAsync({ id: userId, status: newStatus });
    } catch {
      alert('Failed to update user status.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Identity & Access Management</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-heading">Users & RBAC</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit youth centre accounts, enforce security policies, and manage assigned roles.
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setStatusFilter(undefined)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              statusFilter === undefined ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Accounts
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              statusFilter === 'ACTIVE' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Only
          </button>
          <button
            onClick={() => setStatusFilter('SUSPENDED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              statusFilter === 'SUSPENDED' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Suspended
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20">
            <LoadingSpinner message="Fetching user identities from authentication service..." />
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-rose-700 text-xs font-semibold">
            Unable to fetch centre users. Ensure your active centre is selected and permissions are valid.
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Users in this Centre</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No user accounts found under the current centre context.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">User Identity</th>
                  <th className="py-3.5 px-4">Roles</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">Last Activity</th>
                  <th className="py-3.5 px-6 text-right">RBAC Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                          {u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {u.email}
                          </p>
                          {u.phone && (
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {u.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {u.roles && u.roles.length > 0 ? (
                          u.roles.map((role) => (
                            <Badge
                              key={role}
                              variant={
                                role.includes('ADMIN')
                                  ? 'purple'
                                  : role.includes('COUNSELLOR')
                                  ? 'amber'
                                  : 'blue'
                              }
                            >
                              {role.replace('ROLE_', '')}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">No roles</span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {hasAnyRole(['SUPER_ADMIN', 'CENTRE_ADMIN']) ? (
                        <select
                          value={u.status}
                          onChange={(e) => handleStatusChange(u.id, e.target.value as UserStatus)}
                          className={`text-xs font-semibold rounded-lg px-2 py-1 border focus:outline-none cursor-pointer ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : u.status === 'SUSPENDED'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-slate-50 text-slate-800 border-slate-300'
                          }`}
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="SUSPENDED">SUSPENDED</option>
                          <option value="INACTIVE">INACTIVE</option>
                          <option value="PENDING_VERIFICATION">PENDING</option>
                        </select>
                      ) : (
                        <Badge variant={u.status === 'ACTIVE' ? 'emerald' : 'rose'}>
                          {u.status}
                        </Badge>
                      )}
                    </td>

                    <td className="py-4 px-4 text-slate-500">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      {hasAnyRole(['SUPER_ADMIN', 'CENTRE_ADMIN']) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUserForRole({ id: u.id, email: u.email })}
                          leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-amber-600" />}
                        >
                          Assign Role
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeCentreId && selectedUserForRole && (
        <AssignRoleModal
          isOpen={!!selectedUserForRole}
          onClose={() => setSelectedUserForRole(null)}
          userId={selectedUserForRole.id}
          userEmail={selectedUserForRole.email}
          centreId={activeCentreId}
        />
      )}
    </div>
  );
};
