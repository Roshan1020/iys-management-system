import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMe } from '../../hooks/useUsers';
import { authApi } from '../../api/authApi';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  UserCheck,
  Lock,
  Mail,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { data: me, isLoading } = useMe();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setErrorMsg('Please enter both current and new password.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    try {
      setIsChangingPassword(true);
      setErrorMsg(null);
      await authApi.changePassword({ currentPassword, newPassword });
      setSuccessMsg('Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const errorText =
        (err as { response?: { data?: { error?: { message?: string } } }; message?: string })?.response
          ?.data?.error?.message ||
        (err as Error).message ||
        'Failed to change password. Ensure current password is correct.';
      setErrorMsg(errorText);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
          <UserCheck className="w-4 h-4" />
          <span>Devotee Account</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 font-heading">My Profile & Security</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View your session identity, assigned RBAC permissions, and update login credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="md:col-span-1 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs text-center flex flex-col justify-between">
          <div>
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-extrabold text-2xl mx-auto shadow-md shadow-orange-500/25 ring-4 ring-amber-100 mb-4">
              🪷
            </div>
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              {user?.email.split('@')[0]}
            </h2>
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5 mt-1">
              <Mail className="w-3.5 h-3.5" />
              {user?.email}
            </p>

            <div className="mt-4 pt-4 border-t border-slate-100 text-left space-y-2.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Assigned Roles
              </p>
              <div className="flex flex-wrap gap-1.5">
                {user?.roles?.map((role) => (
                  <Badge key={role} variant="amber" size="sm">
                    {role.replace('ROLE_', '')}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-left">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">User ID</span>
            <span className="text-[11px] font-mono text-slate-600 truncate block mt-0.5">
              {user?.userId}
            </span>
          </div>
        </div>

        {/* Identity Details & Change Password */}
        <div className="md:col-span-2 space-y-6">
          {/* Identity details fetched from /api/v1/users/me */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-amber-600" />
              <span>Identity Verification</span>
            </h2>

            {isLoading ? (
              <LoadingSpinner message="Loading identity..." size="sm" />
            ) : me ? (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">Status</span>
                  <Badge variant={me.status === 'ACTIVE' ? 'emerald' : 'rose'} size="sm" className="mt-1">
                    {me.status}
                  </Badge>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">Member Since</span>
                  <span className="text-slate-800 font-medium text-xs mt-1 block flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(me.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Identity details active via JWT.</p>
            )}
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2 mb-1">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Change Password</span>
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Update your password regularly to keep your youth centre account secure.
            </p>

            {successMsg && (
              <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label="Current Password *"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="New Password (min 8 chars) *"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />

                <Input
                  label="Confirm New Password *"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isChangingPassword}
                >
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
