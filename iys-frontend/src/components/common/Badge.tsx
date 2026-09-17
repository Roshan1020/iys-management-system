import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'amber' | 'emerald' | 'blue' | 'purple' | 'rose' | 'slate';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'amber',
  size = 'sm',
  className,
}) => {
  const variantStyles = {
    amber: 'bg-amber-100 text-amber-900 border border-amber-300/60',
    emerald: 'bg-emerald-100 text-emerald-900 border border-emerald-300/60',
    blue: 'bg-blue-100 text-blue-900 border border-blue-300/60',
    purple: 'bg-purple-100 text-purple-900 border border-purple-300/60',
    rose: 'bg-rose-100 text-rose-900 border border-rose-300/60',
    slate: 'bg-slate-100 text-slate-800 border border-slate-300/60',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-semibold rounded-md',
    md: 'px-2.5 py-1 text-sm font-semibold rounded-lg',
  };

  return (
    <span className={twMerge(clsx('inline-flex items-center gap-1 font-medium', sizeStyles[size], variantStyles[variant], className))}>
      {children}
    </span>
  );
};
