import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface RoleGuardProps {
  roles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ roles, children, fallback }) => {
  const { hasAnyRole } = useAuth();

  if (!hasAnyRole(roles)) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-8 text-center max-w-md mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-rose-900">Access Restricted</h3>
        <p className="text-xs text-rose-700 mt-1">
          Your account does not have permission to view or manage this section.
          Required roles: {roles.join(', ')}.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
