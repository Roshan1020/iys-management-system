import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { useAssignRole, useRoles } from '../../hooks/useUsers';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

interface AssignRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  userEmail: string | null;
  centreId: string;
}

export const AssignRoleModal: React.FC<AssignRoleModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  centreId,
}) => {
  const assignMutation = useAssignRole();
  const { data: rolesData, isLoading: rolesLoading } = useRoles();

  const [selectedRoleName, setSelectedRoleName] = useState<string>('CENTRE_ADMIN');
  const [error, setError] = useState<string | null>(null);

  // Fallback role list if backend is still initializing
  const roles = rolesData && rolesData.length > 0 
    ? rolesData 
    : [
        { id: '', name: 'CENTRE_ADMIN', description: 'Centre management & devotees' },
        { id: '', name: 'COUNSELLOR', description: 'Devotee counseling & sadhana audit' },
        { id: '', name: 'EVENT_MANAGER', description: 'Events, sessions and attendance' },
        { id: '', name: 'SEVA_COORDINATOR', description: 'Volunteer enrollments & seva' },
        { id: '', name: 'OUTREACH_OFFICER', description: 'Preaching & contacts follow-up' },
        { id: '', name: 'DEVOTEE', description: 'General youth devotee access' },
        { id: '', name: 'SUPER_ADMIN', description: 'Full global system control' },
      ];

  const selectedRole = roles.find((r) => r.name === selectedRoleName) || roles[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !selectedRole) return;

    try {
      setError(null);
      await assignMutation.mutateAsync({
        id: userId,
        payload: {
          roleId: selectedRole.id ? selectedRole.id : undefined,
          roleName: selectedRole.name,
          centreId: centreId || undefined,
        },
      });
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: { message?: string } } }; message?: string })?.response
          ?.data?.error?.message ||
        (err as Error).message ||
        'Failed to assign role.';
      setError(errorMsg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign RBAC Role"
      description={`Grant permissions to user: ${userEmail || ''}`}
      maxWidth="md"
    >
      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Select Role to Assign
          </label>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {rolesLoading && (
              <div className="flex items-center justify-center py-4 text-xs text-slate-500 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                <span>Loading latest system roles...</span>
              </div>
            )}
            {roles.map((role) => (
              <label
                key={role.name}
                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  selectedRoleName === role.name
                    ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="roleSelect"
                  value={role.name}
                  checked={selectedRoleName === role.name}
                  onChange={() => setSelectedRoleName(role.name)}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">{role.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{role.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={assignMutation.isPending}
            leftIcon={<ShieldCheck className="w-4 h-4" />}
          >
            Assign Role
          </Button>
        </div>
      </form>
    </Modal>
  );
};
