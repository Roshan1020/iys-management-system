import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCentres } from '../../hooks/useCentres';
import { useDevotees } from '../../hooks/useDevotees';
import { useUsersByCentre } from '../../hooks/useUsers';
import {
  Users,
  Building2,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Award,
  Sparkles,
  ArrowUpRight,
  UserPlus,
  PlusCircle,
} from 'lucide-react';
import { Button } from '../../components/common/Button';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, activeCentreId, hasAnyRole } = useAuth();

  const { data: centresData } = useCentres(false, 0, 100);
  const { data: devoteesData } = useDevotees({
    centreId: activeCentreId || undefined,
    page: 0,
    size: 100,
  });
  const { data: usersData } = useUsersByCentre(activeCentreId || undefined, undefined, 0, 100);

  const activeCentre = centresData?.content?.find((c) => c.id === activeCentreId);

  // Profile type breakdown from devotees list
  const devotees = devoteesData?.content || [];
  const studentCount = devotees.filter((d) => d.profileType === 'STUDENT').length;
  const professionalCount = devotees.filter((d) => d.profileType === 'WORKING_PROFESSIONAL').length;
  const alumniCount = devotees.filter((d) => d.profileType === 'ALUMNI').length;
  const generalCount = devotees.filter((d) => d.profileType === 'OTHER').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Devotee Greeting Hero */}
      <div className="rounded-3xl p-8 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-xl shadow-orange-500/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-amber-100 mb-3 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              Hare Krishna Sangha
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-heading">
              Hare Krishna, {user?.email.split('@')[0]}!
            </h1>
            <p className="text-sm text-amber-100/95 mt-1 max-w-xl leading-relaxed">
              All Glories to Srila Prabhupada. Managing operations for{' '}
              <span className="font-bold underline decoration-amber-300">
                {activeCentre ? activeCentre.name : 'your active centre'}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {hasAnyRole(['COUNSELLOR', 'CENTRE_ADMIN', 'SUPER_ADMIN']) && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/devotees')}
                leftIcon={<UserPlus className="w-4 h-4 text-amber-400" />}
                className="bg-slate-900/90 hover:bg-slate-950 border border-white/20"
              >
                Devotee Directory
              </Button>
            )}
            {hasAnyRole(['SUPER_ADMIN']) && (
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/centres')}
                leftIcon={<PlusCircle className="w-4 h-4 text-slate-800" />}
                className="bg-white/95 text-slate-900 hover:bg-white border-0 shadow-md"
              >
                Manage Centres
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Devotees */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Devotees</span>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-heading">
              {devoteesData?.totalElements ?? devotees.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">registered</span>
          </div>
          <p className="text-xs text-amber-600 font-medium mt-2 flex items-center gap-1">
            <span>In active centre</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </p>
        </div>

        {/* Total Centres */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Centres Active</span>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-heading">
              {centresData?.totalElements ?? (centresData?.content?.length || 1)}
            </span>
            <span className="text-xs text-slate-500 font-medium">locations</span>
          </div>
          <p className="text-xs text-blue-600 font-medium mt-2 flex items-center gap-1">
            <span>Across regions</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </p>
        </div>

        {/* User Accounts */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">User Accounts</span>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-heading">
              {usersData?.totalElements ?? (usersData?.content?.length || 0)}
            </span>
            <span className="text-xs text-slate-500 font-medium">identities</span>
          </div>
          <p className="text-xs text-purple-600 font-medium mt-2 flex items-center gap-1">
            <span>With assigned roles</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </p>
        </div>

        {/* Active Centre Details */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Centre Code</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
              {activeCentre?.shortCode || 'IYS'}
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-bold text-slate-900 truncate block">
              {activeCentre?.city || 'Selected City'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {activeCentre?.country || 'India'}
            </span>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-2">
            Status: {activeCentre?.isActive !== false ? 'Operational' : 'Inactive'}
          </p>
        </div>
      </div>

      {/* Devotee Profile Demographic Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">
                Youth Demographic Classification
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribution of youth members by educational and professional status
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/devotees')}
            >
              View All
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-center">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2">
                <GraduationCap className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-amber-900 font-heading">{studentCount}</p>
              <p className="text-xs font-semibold text-amber-800 mt-1">Students</p>
              <p className="text-[11px] text-amber-600">College / Hostels</p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/60 text-center">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-2">
                <Briefcase className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-blue-900 font-heading">{professionalCount}</p>
              <p className="text-xs font-semibold text-blue-800 mt-1">Professionals</p>
              <p className="text-[11px] text-blue-600">IT / Corporate</p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/60 text-center">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-2">
                <Award className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-purple-900 font-heading">{alumniCount}</p>
              <p className="text-xs font-semibold text-purple-800 mt-1">Alumni</p>
              <p className="text-[11px] text-purple-600">Graduates & Guides</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200 text-center">
              <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center mx-auto mb-2">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-800 font-heading">{generalCount}</p>
              <p className="text-xs font-semibold text-slate-700 mt-1">General</p>
              <p className="text-[11px] text-slate-500">Congregation</p>
            </div>
          </div>
        </div>

        {/* Spiritual Modules Roadmap / Quick Info */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 md:p-8 border border-slate-700/80 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Modular Monolith Roadmap</span>
            </div>
            <h3 className="text-lg font-bold font-heading">Upcoming IYS Modules</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Phase 1 provides Core Identity, RBAC, Centres, and Profiles. Upcoming backend phases will activate:
            </p>

            <ul className="mt-4 space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>CMD 4: Daily Sadhana Tracker & Japa count</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                <span>CMD 5: Mentor-Mentee Counselling assignments</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>CMD 6: Youth Festivals, Sessions & Attendance</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>CMD 7: Devotee Career Referrals & Job Portal</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Spring Boot 3.x + Flyway</span>
            <span>REST API Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
