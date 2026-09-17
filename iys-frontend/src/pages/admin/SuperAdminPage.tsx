import React, { useState } from 'react';
import { useCentres, useCreateCentre } from '../../hooks/useCentres';
import { useUsersByCentre, useUpdateUserStatus, useAssignRole, useRevokeRole, useRoles } from '../../hooks/useUsers';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  ShieldCheck,
  Building2,
  Copy,
  Check,
  Share2,
  UserPlus,
  Shield,
  Crown,
  Sparkles,
  Link as LinkIcon,
  MessageSquare,
  AlertCircle,
  Users,
} from 'lucide-react';
import { CentreResponse } from '../../types/centre';
import { UserResponse } from '../../types/user';

export const SuperAdminPage: React.FC = () => {
  const { data: centresData } = useCentres(false, 0, 100);
  const { data: rolesData } = useRoles();

  const createCentreMutation = useCreateCentre();
  const updateUserStatusMutation = useUpdateUserStatus();
  const assignRoleMutation = useAssignRole();
  const revokeRoleMutation = useRevokeRole();

  const centres = centresData?.content || [];

  // Selected Centre for managing users
  const [selectedCentreId, setSelectedCentreId] = useState<string>('');
  const activeCentreId = selectedCentreId || (centres[0]?.id ?? '');

  const { data: usersData, isLoading: usersLoading } = useUsersByCentre(
    activeCentreId || undefined,
    undefined,
    0,
    100
  );

  const users = usersData?.content || [];
  const activeCentre = centres.find((c) => c.id === activeCentreId);

  // New Centre Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [centreName, setCentreName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Newly Created Centre Share Dialog
  const [createdCentre, setCreatedCentre] = useState<CentreResponse | null>(null);

  // Assign Custom Role Modal State
  const [roleModalUser, setRoleModalUser] = useState<UserResponse | null>(null);
  const [customRoleId, setCustomRoleId] = useState<string>('');

  // Copy to clipboard status
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCreateCentre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!centreName || !shortCode || !city) {
      setCreateError('Please fill in Centre Name, Short Code, and City.');
      return;
    }

    try {
      setCreateError(null);
      const res = await createCentreMutation.mutateAsync({
        name: centreName,
        shortCode: shortCode.toUpperCase(),
        city,
        state: state || undefined,
        country,
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
      });

      setIsCreateModalOpen(false);
      setCreatedCentre(res.data);
      setSelectedCentreId(res.data.id);

      // Reset form
      setCentreName('');
      setShortCode('');
      setCity('');
      setState('');
      setContactEmail('');
      setContactPhone('');
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: { message?: string } } }; message?: string })?.response
          ?.data?.error?.message ||
        (err as Error).message ||
        'Failed to create centre.';
      setCreateError(errorMsg);
    }
  };

  const handlePromoteToCentreAdmin = async (user: UserResponse) => {
    const targetCentreId = activeCentreId || user.centreId;
    if (!targetCentreId) return;

    try {
      const centreAdminRole = rolesData?.find((r) => r.name === 'CENTRE_ADMIN');
      await assignRoleMutation.mutateAsync({
        id: user.id,
        payload: {
          roleId: centreAdminRole?.id,
          roleName: 'CENTRE_ADMIN',
          centreId: targetCentreId,
        },
      });

      // Also ensure user is ACTIVE
      if (user.status !== 'ACTIVE') {
        await updateUserStatusMutation.mutateAsync({ id: user.id, status: 'ACTIVE' });
      }
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to promote user to Centre Admin.');
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await updateUserStatusMutation.mutateAsync({ id: userId, status: 'ACTIVE' });
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to activate user.');
    }
  };

  const handleAssignCustomRole = async () => {
    if (!roleModalUser || !customRoleId) return;
    const targetCentreId = activeCentreId || roleModalUser.centreId;
    if (!targetCentreId) return;

    const roleObj = rolesData?.find((r) => r.id === customRoleId);
    try {
      await assignRoleMutation.mutateAsync({
        id: roleModalUser.id,
        payload: {
          roleId: customRoleId,
          roleName: roleObj?.name,
          centreId: targetCentreId,
        },
      });
      setRoleModalUser(null);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to assign role.');
    }
  };

  const handleRevokeRole = async (userId: string, roleName: string) => {
    if (!activeCentreId) return;
    const role = rolesData?.find((r) => r.name === roleName);
    if (!role) {
      alert(`Role ${roleName} ID not found.`);
      return;
    }

    if (!confirm(`Are you sure you want to revoke ${roleName} from this user?`)) return;

    try {
      await revokeRoleMutation.mutateAsync({
        id: userId,
        roleId: role.id,
        centreId: activeCentreId,
      });
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to revoke role.');
    }
  };

  const registrationLink = activeCentre
    ? `${window.location.origin}/register?centreId=${activeCentre.id}`
    : '';

  const inviteMessage = activeCentre
    ? `Hare Krishna! You are invited to join ISKCON ${activeCentre.name}. Please register your devotee profile at:\n${registrationLink}\n(Centre ID: ${activeCentre.id})\nOnce registered, let the admin know to activate your access.`
    : '';

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Super Admin Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white shadow-xl border border-amber-500/30 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-semibold uppercase tracking-wider mb-3">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              Global Administration
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
              Super Admin Control Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Create youth centres, generate and dispatch Centre IDs to leaders, and appoint Centre Admins who register with their assigned Centre ID.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Building2 className="w-4 h-4" />}
            className="shadow-lg shadow-orange-500/30 shrink-0"
          >
            Create New Centre
          </Button>
        </div>
      </div>

      {/* SECTION 1: Centre ID Sharing & Dispatch Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
              <Share2 className="w-4 h-4 text-amber-600" />
              <span>Centre Identification & Onboarding Dispatch</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a centre below to copy its auto-generated Centre ID or share direct registration links with users.
            </p>
          </div>

          {/* Centre Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Select Centre:</span>
            <select
              value={activeCentreId}
              onChange={(e) => setSelectedCentreId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-amber-50/60 px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:border-amber-500 cursor-pointer"
            >
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.shortCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeCentre ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Centre ID Box */}
            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                  Auto-Generated Centre ID (UUID)
                </span>
                <p className="font-mono text-xs font-bold text-slate-800 bg-white p-3 rounded-xl border border-amber-200/70 mt-2 break-all select-all">
                  {activeCentre.id}
                </p>
                <p className="text-[11px] text-slate-500 mt-2">
                  Share this ID with leaders so they can enter it while registering.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(activeCentre.id, 'centreId')}
                leftIcon={copiedKey === 'centreId' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                className="mt-4 w-full bg-white text-slate-800"
              >
                {copiedKey === 'centreId' ? 'Copied to Clipboard!' : 'Copy Centre ID'}
              </Button>
            </div>

            {/* Direct Link Box */}
            <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
                  Direct Pre-Filled Registration URL
                </span>
                <p className="font-mono text-xs text-blue-950 bg-white p-3 rounded-xl border border-blue-200/70 mt-2 break-all truncate">
                  {registrationLink}
                </p>
                <p className="text-[11px] text-slate-500 mt-2">
                  When users open this link, the Centre ID is automatically locked and selected for them.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(registrationLink, 'regLink')}
                leftIcon={copiedKey === 'regLink' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <LinkIcon className="w-3.5 h-3.5 text-blue-600" />}
                className="mt-4 w-full bg-white text-slate-800"
              >
                {copiedKey === 'regLink' ? 'Registration Link Copied!' : 'Copy Registration Link'}
              </Button>
            </div>

            {/* Ready WhatsApp/Email Message Box */}
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Ready-to-Send Invitation Template
                </span>
                <p className="text-xs text-emerald-950 bg-white p-3 rounded-xl border border-emerald-200/70 mt-2 line-clamp-3 italic">
                  "{inviteMessage}"
                </p>
                <p className="text-[11px] text-slate-500 mt-2">
                  Pre-composed message ready to paste into WhatsApp, Slack, or Email.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(inviteMessage, 'inviteMsg')}
                leftIcon={copiedKey === 'inviteMsg' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />}
                className="mt-4 w-full bg-white text-slate-800"
              >
                {copiedKey === 'inviteMsg' ? 'Invitation Copied!' : 'Copy Full Invitation Message'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 text-xs">
            No centre selected or available. Click "Create New Centre" above.
          </div>
        )}
      </div>

      {/* SECTION 2: Appoint Centre Admins & User Management */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Registered Devotees & Admin Appointment</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Users registered under{' '}
              <strong className="text-amber-800 font-semibold">{activeCentre?.name || 'this Centre'}</strong>. Promote them to Centre Admin with one click.
            </p>
          </div>

          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
            {users.length} Users Enrolled
          </span>
        </div>

        {usersLoading ? (
          <div className="py-20">
            <LoadingSpinner message="Fetching centre user roster..." />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Users Enrolled Under This Centre ID Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Share the Centre ID or registration link above. Once a devotee creates an account using this Centre ID, they will appear right here for admin appointment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">User Account</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Current Roles</th>
                  <th className="py-3.5 px-6 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {users.map((u) => {
                  const isCentreAdmin = u.roles?.includes('CENTRE_ADMIN');
                  const isSuperAdmin = u.roles?.includes('SUPER_ADMIN');

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                            {u.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.email}</p>
                            <p className="text-[10px] font-mono text-slate-400">ID: {u.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {u.status === 'PENDING_VERIFICATION' ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="rose" size="sm">
                              Pending
                            </Badge>
                            <button
                              onClick={() => handleActivateUser(u.id)}
                              className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                            >
                              Activate
                            </button>
                          </div>
                        ) : (
                          <Badge variant={u.status === 'ACTIVE' ? 'emerald' : 'slate'} size="sm">
                            {u.status}
                          </Badge>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles?.map((r) => (
                            <span
                              key={r}
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                r === 'SUPER_ADMIN'
                                  ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                  : r === 'CENTRE_ADMIN'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-slate-100 text-slate-800 border border-slate-200'
                              }`}
                            >
                              {r}
                              {r !== 'DEVOTEE' && (
                                <button
                                  onClick={() => handleRevokeRole(u.id, r)}
                                  className="text-slate-400 hover:text-rose-600 ml-0.5 cursor-pointer"
                                  title="Revoke Role"
                                >
                                  &times;
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right space-x-2">
                        {!isCentreAdmin && !isSuperAdmin ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handlePromoteToCentreAdmin(u)}
                            leftIcon={<Shield className="w-3.5 h-3.5" />}
                            isLoading={assignRoleMutation.isPending}
                          >
                            Appoint Centre Admin
                          </Button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80 mr-2">
                            <Sparkles className="w-3 h-3" />
                            Admin Active
                          </span>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRoleModalUser(u);
                            setCustomRoleId(rolesData?.[0]?.id || '');
                          }}
                        >
                          More Roles
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Create New Centre */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Establish New Youth Centre"
        description="Auto-generates a clean Centre UUID to share with youth leaders"
        maxWidth="lg"
      >
        {createError && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{createError}</span>
          </div>
        )}

        <form onSubmit={handleCreateCentre} className="space-y-4">
          <Input
            label="Centre Name *"
            placeholder="e.g. ISKCON Bangalore Youth Forum"
            value={centreName}
            onChange={(e) => setCentreName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Short Code (3-6 Letters) *"
              placeholder="e.g. BLR-YF"
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value.toUpperCase())}
              required
            />

            <Input
              label="City *"
              placeholder="e.g. Bangalore"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="State / Province"
              placeholder="e.g. Karnataka"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />

            <Input
              label="Country *"
              placeholder="India"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Official Contact Email"
              type="email"
              placeholder="youth@iskconbangalore.org"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />

            <Input
              label="Contact Phone"
              placeholder="+91 9876543210"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="md" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={createCentreMutation.isPending}
              leftIcon={<Building2 className="w-4 h-4" />}
            >
              Generate Centre & ID
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Newly Created Centre Confirmation & Dispatch Dialog */}
      {createdCentre && (
        <Modal
          isOpen={!!createdCentre}
          onClose={() => setCreatedCentre(null)}
          title="Centre Created Successfully!"
          description="Your new Centre is registered. Copy the details below to share with your administrator."
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-center">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                {createdCentre.name} ({createdCentre.shortCode})
              </span>
              <p className="font-mono text-sm font-extrabold text-slate-900 bg-white p-3 rounded-xl border border-amber-200 mt-2 select-all">
                {createdCentre.id}
              </p>
              <p className="text-[11px] text-amber-900 mt-1">
                Auto-generated Centre ID is ready to share.
              </p>
            </div>

            <div className="space-y-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => copyToClipboard(createdCentre.id, 'newCentreId')}
                leftIcon={copiedKey === 'newCentreId' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                className="w-full"
              >
                {copiedKey === 'newCentreId' ? 'Centre ID Copied!' : 'Copy Centre ID'}
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() =>
                  copyToClipboard(
                    `${window.location.origin}/register?centreId=${createdCentre.id}`,
                    'newRegLink'
                  )
                }
                leftIcon={copiedKey === 'newRegLink' ? <Check className="w-4 h-4 text-emerald-600" /> : <LinkIcon className="w-4 h-4" />}
                className="w-full"
              >
                {copiedKey === 'newRegLink' ? 'Registration Link Copied!' : 'Copy Direct Registration Link'}
              </Button>
            </div>

            <div className="flex justify-end pt-3">
              <Button variant="secondary" size="md" onClick={() => setCreatedCentre(null)}>
                Done & View Centre Roster
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: Assign Custom Role Dialog */}
      {roleModalUser && (
        <Modal
          isOpen={!!roleModalUser}
          onClose={() => setRoleModalUser(null)}
          title="Assign Role to User"
          description={`Grant permission to ${roleModalUser.email}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                Select Role to Grant
              </label>
              <select
                value={customRoleId}
                onChange={(e) => setCustomRoleId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:border-amber-500"
              >
                {rolesData?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} - {r.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setRoleModalUser(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAssignCustomRole}
                isLoading={assignRoleMutation.isPending}
                leftIcon={<UserPlus className="w-3.5 h-3.5" />}
              >
                Confirm Role Assignment
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
