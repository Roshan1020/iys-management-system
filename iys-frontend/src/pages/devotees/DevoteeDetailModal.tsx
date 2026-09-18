import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import {
  useDevotee,
  useUpsertStudentProfile,
  useUpsertProfessionalProfile,
  useUpsertAlumniProfile,
} from '../../hooks/useDevotees';
import {
  User,
  GraduationCap,
  Briefcase,
  Award,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

interface DevoteeDetailModalProps {
  devoteeId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DevoteeDetailModal: React.FC<DevoteeDetailModalProps> = ({
  devoteeId,
  isOpen,
  onClose,
}) => {
  const { user, hasRole } = useAuth();
  const isSuperAdmin = hasRole('SUPER_ADMIN');
  const isCentreAdmin = hasRole('CENTRE_ADMIN');

  const { data: devotee, isLoading } = useDevotee(devoteeId || undefined);

  // CENTRE_ADMIN only has rights to take action on same-centre devotees
  const isSameCentre = !devotee?.centreId || devotee?.centreId === user?.centreId;
  const canTakeAction = isSuperAdmin || (isCentreAdmin && isSameCentre);

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'STUDENT' | 'PROFESSIONAL' | 'ALUMNI'>('OVERVIEW');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Student Sub-profile state
  const [collegeName, setCollegeName] = useState('');
  const [degree, setDegree] = useState('');
  const [branch, setBranch] = useState('');
  const [gradYear, setGradYear] = useState<number>(2026);
  const [currentYear, setCurrentYear] = useState<number>(3);
  const [hostel, setHostel] = useState('Hosteller');

  // Professional Sub-profile state
  const [companyName, setCompanyName] = useState('');
  const [designation, setDesignation] = useState('');
  const [industry, setIndustry] = useState('Information Technology');
  const [totalExp, setTotalExp] = useState<number>(3);
  const [workCity, setWorkCity] = useState('');

  // Alumni Sub-profile state
  const [highestDegree, setHighestDegree] = useState('');
  const [currentOrg, setCurrentOrg] = useState('');
  const [mentorshipOffered, setMentorshipOffered] = useState(true);

  const studentMutation = useUpsertStudentProfile();
  const profMutation = useUpsertProfessionalProfile();
  const alumniMutation = useUpsertAlumniProfile();

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devoteeId || !canTakeAction) return;
    try {
      setErrorMessage(null);
      await studentMutation.mutateAsync({
        id: devoteeId,
        payload: {
          collegeName,
          degree,
          branch,
          graduationYear: Number(gradYear),
          currentYear: Number(currentYear),
          hostelOrDayScholar: hostel,
        },
      });
      setSuccessMessage('Student profile successfully updated.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setErrorMessage('Failed to update student profile.');
    }
  };

  const handleSaveProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devoteeId || !canTakeAction) return;
    try {
      setErrorMessage(null);
      await profMutation.mutateAsync({
        id: devoteeId,
        payload: {
          companyName,
          designation,
          industry,
          totalExpYears: Number(totalExp),
          workCity,
        },
      });
      setSuccessMessage('Professional profile successfully updated.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setErrorMessage('Failed to update professional profile.');
    }
  };

  const handleSaveAlumni = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devoteeId || !canTakeAction) return;
    try {
      setErrorMessage(null);
      await alumniMutation.mutateAsync({
        id: devoteeId,
        payload: {
          highestDegree,
          currentOrganization: currentOrg,
          mentorshipOffered,
        },
      });
      setSuccessMessage('Alumni profile successfully updated.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setErrorMessage('Failed to update alumni profile.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={devotee?.legalName ? `${devotee.legalName} ${devotee.initiatedName ? `(${devotee.initiatedName})` : ''}` : 'Devotee Profile'}
      description="View full devotee details and manage sub-profile categories"
      maxWidth="2xl"
    >
      {isLoading ? (
        <LoadingSpinner message="Retrieving devotee record..." />
      ) : !devotee ? (
        <p className="text-sm text-slate-500 text-center py-6">Devotee record not found.</p>
      ) : (
        <div className="space-y-6">
          {/* Action Restriction Warning for External Centre Devotees */}
          {!canTakeAction && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200/90 p-3.5 text-amber-900 text-xs flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold">Read-Only View: Action Rights Restricted</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  You are viewing a devotee from another centre. As a Centre Administrator, you only have rights to take action on same-centre devotees.
                </p>
              </div>
            </div>
          )}

          {/* Header Summary */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-orange-500/20">
                {devotee.initiatedName?.[0] || devotee.legalName[0]}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 font-heading">
                  {devotee.initiatedName || devotee.legalName}
                </h4>
                <p className="text-xs text-slate-500">Legal Name: {devotee.legalName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="amber" size="md">
                {devotee.profileType}
              </Badge>
              <Badge variant="slate" size="md">
                {devotee.initiationStatus || 'ASPIRANT'}
              </Badge>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`pb-3 px-4 flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'OVERVIEW'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('STUDENT')}
              className={`pb-3 px-4 flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'STUDENT'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student Profile</span>
            </button>
            <button
              onClick={() => setActiveTab('PROFESSIONAL')}
              className={`pb-3 px-4 flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'PROFESSIONAL'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Professional Profile</span>
            </button>
            <button
              onClick={() => setActiveTab('ALUMNI')}
              className={`pb-3 px-4 flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'ALUMNI'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Alumni Profile</span>
            </button>
          </div>

          {successMessage && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-semibold uppercase block text-[10px]">Spiritual Master</span>
                <span className="text-slate-800 font-medium text-sm mt-0.5 block">
                  {devotee.spiritualMaster || 'Under guidance / Shelter pending'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-semibold uppercase block text-[10px]">Initiation Date</span>
                <span className="text-slate-800 font-medium text-sm mt-0.5 block flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {devotee.initiatedDate || 'Not applicable'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-semibold uppercase block text-[10px]">Phone Contact</span>
                <span className="text-slate-800 font-medium text-sm mt-0.5 block flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {devotee.phone || 'No phone recorded'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-semibold uppercase block text-[10px]">City & Region</span>
                <span className="text-slate-800 font-medium text-sm mt-0.5 block flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {devotee.city || 'N/A'}, {devotee.state || ''}
                </span>
              </div>

              <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-semibold uppercase block text-[10px]">Devotee Notes</span>
                <p className="text-slate-700 text-xs mt-1 leading-relaxed">
                  {devotee.notes || 'No specific notes recorded for this devotee.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: STUDENT PROFILE */}
          {activeTab === 'STUDENT' && (
            <form onSubmit={handleSaveStudent} className="space-y-4">
              <p className="text-xs text-slate-500">
                Track academic progress, college name, and degree for student preaching and youth hostel engagement.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="College / University Name *"
                  placeholder="e.g. COEP Pune"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  disabled={!canTakeAction}
                  required
                />
                <Input
                  label="Degree *"
                  placeholder="e.g. B.Tech"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  disabled={!canTakeAction}
                  required
                />
                <Input
                  label="Branch / Major"
                  placeholder="e.g. Computer Engineering"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  disabled={!canTakeAction}
                />
                <Input
                  label="Graduation Year"
                  type="number"
                  placeholder="2026"
                  value={gradYear}
                  onChange={(e) => setGradYear(Number(e.target.value))}
                  disabled={!canTakeAction}
                />
                <Input
                  label="Current Year of Study"
                  type="number"
                  placeholder="3"
                  value={currentYear}
                  onChange={(e) => setCurrentYear(Number(e.target.value))}
                  disabled={!canTakeAction}
                />
                <Input
                  label="Hostel / Day Scholar"
                  placeholder="e.g. Campus Hostel Room 204"
                  value={hostel}
                  onChange={(e) => setHostel(e.target.value)}
                  disabled={!canTakeAction}
                />
              </div>

              <div className="flex justify-end pt-2">
                {canTakeAction ? (
                  <Button type="submit" variant="primary" size="md" isLoading={studentMutation.isPending}>
                    Save Student Profile
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium py-2 px-3.5 bg-slate-100 rounded-xl border border-slate-200">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Action restricted: Devotee belongs to an external centre</span>
                  </div>
                )}
              </div>
            </form>
          )}

          {/* TAB 3: PROFESSIONAL PROFILE */}
          {activeTab === 'PROFESSIONAL' && (
            <form onSubmit={handleSaveProfessional} className="space-y-4">
              <p className="text-xs text-slate-500">
                Track professional careers, corporate company details, and work locations for professional devotee programs.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Company Name *"
                  placeholder="e.g. Infosys Ltd"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={!canTakeAction}
                  required
                />
                <Input
                  label="Designation *"
                  placeholder="e.g. Senior Software Engineer"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  disabled={!canTakeAction}
                  required
                />
                <Input
                  label="Industry / Domain"
                  placeholder="e.g. Fintech / IT Services"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  disabled={!canTakeAction}
                />
                <Input
                  label="Total Experience (Years)"
                  type="number"
                  value={totalExp}
                  onChange={(e) => setTotalExp(Number(e.target.value))}
                  disabled={!canTakeAction}
                />
                <Input
                  label="Work City"
                  placeholder="e.g. Bengaluru"
                  value={workCity}
                  onChange={(e) => setWorkCity(e.target.value)}
                  disabled={!canTakeAction}
                />
              </div>

              <div className="flex justify-end pt-2">
                {canTakeAction ? (
                  <Button type="submit" variant="primary" size="md" isLoading={profMutation.isPending}>
                    Save Professional Profile
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium py-2 px-3.5 bg-slate-100 rounded-xl border border-slate-200">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Action restricted: Devotee belongs to an external centre</span>
                  </div>
                )}
              </div>
            </form>
          )}

          {/* TAB 4: ALUMNI PROFILE */}
          {activeTab === 'ALUMNI' && (
            <form onSubmit={handleSaveAlumni} className="space-y-4">
              <p className="text-xs text-slate-500">
                Track alumni records, senior mentors, and graduates offering guidance to younger youth devotees.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Highest Degree Obtained"
                  placeholder="e.g. M.Tech / MBA"
                  value={highestDegree}
                  onChange={(e) => setHighestDegree(e.target.value)}
                  disabled={!canTakeAction}
                />
                <Input
                  label="Current Organization"
                  placeholder="e.g. Google / IIT Faculty"
                  value={currentOrg}
                  onChange={(e) => setCurrentOrg(e.target.value)}
                  disabled={!canTakeAction}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="mentorship"
                  checked={mentorshipOffered}
                  onChange={(e) => setMentorshipOffered(e.target.checked)}
                  disabled={!canTakeAction}
                  className="rounded text-amber-600 focus:ring-amber-500 disabled:opacity-50"
                />
                <label htmlFor="mentorship" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Available to mentor current college youth members
                </label>
              </div>

              <div className="flex justify-end pt-2">
                {canTakeAction ? (
                  <Button type="submit" variant="primary" size="md" isLoading={alumniMutation.isPending}>
                    Save Alumni Profile
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium py-2 px-3.5 bg-slate-100 rounded-xl border border-slate-200">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Action restricted: Devotee belongs to an external centre</span>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
};
