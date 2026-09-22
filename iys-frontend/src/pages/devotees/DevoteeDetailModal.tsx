import React, { useState, useEffect } from 'react';
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
  Globe,
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
  const [gradYear, setGradYear] = useState<number | string>(2026);
  const [currentYear, setCurrentYear] = useState<number | string>(3);
  const [studentId, setStudentId] = useState('');
  const [hostel, setHostel] = useState('Hosteller');

  // Professional Sub-profile state
  const [companyName, setCompanyName] = useState('');
  const [designation, setDesignation] = useState('');
  const [industry, setIndustry] = useState('Information Technology');
  const [employmentType, setEmploymentType] = useState('FULL_TIME');
  const [totalExp, setTotalExp] = useState<number | string>(3);
  const [annualIncome, setAnnualIncome] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [workCity, setWorkCity] = useState('');
  const [isMentorWilling, setIsMentorWilling] = useState(true);

  // Alumni Sub-profile state
  const [alumniInstitution, setAlumniInstitution] = useState('');
  const [highestDegree, setHighestDegree] = useState('');
  const [currentOrg, setCurrentOrg] = useState('');
  const [alumniProfession, setAlumniProfession] = useState('');
  const [alumniCity, setAlumniCity] = useState('');
  const [alumniGradYear, setAlumniGradYear] = useState<number | string>(2022);
  const [mentorshipOffered, setMentorshipOffered] = useState(true);

  const studentMutation = useUpsertStudentProfile();
  const profMutation = useUpsertProfessionalProfile();
  const alumniMutation = useUpsertAlumniProfile();

  // Populate existing devotee sub-profiles when retrieved
  useEffect(() => {
    if (devotee) {
      // Student profile prefill
      if (devotee.studentProfile) {
        setCollegeName(devotee.studentProfile.institution || devotee.studentProfile.collegeName || '');
        setDegree(devotee.studentProfile.course || devotee.studentProfile.degree || '');
        setBranch(devotee.studentProfile.specialisation || devotee.studentProfile.branch || '');
        if (devotee.studentProfile.expectedGraduation) {
          const yr = new Date(devotee.studentProfile.expectedGraduation).getFullYear();
          if (!isNaN(yr)) setGradYear(yr);
        } else if (devotee.studentProfile.graduationYear) {
          setGradYear(devotee.studentProfile.graduationYear);
        }
        if (devotee.studentProfile.yearOfStudy) {
          setCurrentYear(devotee.studentProfile.yearOfStudy);
        }
        setStudentId(devotee.studentProfile.studentIdNumber || '');
        setHostel(
          devotee.studentProfile.hostelResident !== undefined
            ? devotee.studentProfile.hostelResident
              ? 'Hosteller'
              : 'Day Scholar'
            : devotee.studentProfile.hostelOrDayScholar || 'Hosteller'
        );
      }

      // Professional profile prefill
      if (devotee.professionalProfile) {
        setCompanyName(devotee.professionalProfile.company || devotee.professionalProfile.companyName || '');
        setDesignation(devotee.professionalProfile.designation || '');
        setIndustry(devotee.professionalProfile.industry || 'Information Technology');
        setEmploymentType(devotee.professionalProfile.employmentType || 'FULL_TIME');
        if (devotee.professionalProfile.experienceYears !== undefined) {
          setTotalExp(devotee.professionalProfile.experienceYears);
        } else if (devotee.professionalProfile.totalExpYears !== undefined) {
          setTotalExp(devotee.professionalProfile.totalExpYears);
        }
        setAnnualIncome(devotee.professionalProfile.annualIncomeRange || '');
        setLinkedinUrl(devotee.professionalProfile.linkedinUrl || '');
        setWorkCity(devotee.professionalProfile.workCity || '');
        setIsMentorWilling(
          devotee.professionalProfile.isMentorWilling ?? devotee.professionalProfile.mentorshipOffered ?? true
        );
      }

      // Alumni profile prefill
      if (devotee.alumniProfile) {
        setAlumniInstitution(devotee.alumniProfile.institution || '');
        setHighestDegree(devotee.alumniProfile.degree || devotee.alumniProfile.highestDegree || '');
        setCurrentOrg(devotee.alumniProfile.currentCompany || devotee.alumniProfile.currentOrganization || '');
        setAlumniProfession(devotee.alumniProfile.currentProfession || '');
        setAlumniCity(devotee.alumniProfile.cityOfResidence || '');
        if (devotee.alumniProfile.graduationYear) {
          setAlumniGradYear(devotee.alumniProfile.graduationYear);
        }
        setMentorshipOffered(
          devotee.alumniProfile.wantsToConnect ?? devotee.alumniProfile.mentorshipOffered ?? true
        );
      }
    }
  }, [devotee]);

  // Clean error and success messages when changing tabs
  const handleTabChange = (tab: 'OVERVIEW' | 'STUDENT' | 'PROFESSIONAL' | 'ALUMNI') => {
    setActiveTab(tab);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devoteeId || !canTakeAction) return;

    if (!collegeName.trim() || !degree.trim()) {
      setErrorMessage('College / University Name and Degree are required.');
      return;
    }

    try {
      setErrorMessage(null);
      const parsedGradYear = Number(gradYear) || new Date().getFullYear();
      await studentMutation.mutateAsync({
        id: devoteeId,
        payload: {
          institution: collegeName.trim(),
          course: degree.trim(),
          specialisation: branch.trim() || undefined,
          yearOfStudy: Number(currentYear) || 1,
          expectedGraduation: `${parsedGradYear}-06-30`,
          studentIdNumber: studentId.trim() || undefined,
          hostelResident: hostel.toLowerCase().includes('hostel'),
          collegeName: collegeName.trim(),
          degree: degree.trim(),
          branch: branch.trim(),
          graduationYear: parsedGradYear,
          currentYear: Number(currentYear) || 1,
          hostelOrDayScholar: hostel,
        },
      });
      setSuccessMessage('Student profile successfully saved!');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
        'Failed to update student profile.';
      setErrorMessage(msg);
    }
  };

  const handleSaveProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devoteeId || !canTakeAction) return;

    if (!companyName.trim() || !designation.trim()) {
      setErrorMessage('Company Name and Designation are required.');
      return;
    }

    try {
      setErrorMessage(null);
      await profMutation.mutateAsync({
        id: devoteeId,
        payload: {
          company: companyName.trim(),
          designation: designation.trim(),
          industry: industry.trim() || undefined,
          employmentType,
          experienceYears: Number(totalExp) || 0,
          annualIncomeRange: annualIncome.trim() || undefined,
          linkedinUrl: linkedinUrl.trim() || undefined,
          isMentorWilling,
          companyName: companyName.trim(),
          totalExpYears: Number(totalExp) || 0,
          workCity: workCity.trim() || undefined,
          mentorshipOffered: isMentorWilling,
        },
      });
      setSuccessMessage('Professional profile successfully saved!');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
        'Failed to update professional profile.';
      setErrorMessage(msg);
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
          institution: (alumniInstitution || collegeName || '').trim() || undefined,
          degree: highestDegree.trim() || undefined,
          currentProfession: alumniProfession.trim() || undefined,
          currentCompany: currentOrg.trim() || undefined,
          cityOfResidence: alumniCity.trim() || undefined,
          graduationYear: Number(alumniGradYear) || undefined,
          isActiveDevotee: true,
          wantsToConnect: mentorshipOffered,
          highestDegree: highestDegree.trim() || undefined,
          currentOrganization: currentOrg.trim() || undefined,
          mentorshipOffered,
        },
      });
      setSuccessMessage('Alumni profile successfully saved!');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
        'Failed to update alumni profile.';
      setErrorMessage(msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        devotee?.legalName
          ? `${devotee.legalName} ${devotee.initiatedName ? `(${devotee.initiatedName})` : ''}`
          : 'Devotee Profile'
      }
      description="View full devotee details and manage sub-profile categories"
      maxWidth="2xl"
    >
      {isLoading ? (
        <LoadingSpinner message="Retrieving devotee record..." />
      ) : !devotee ? (
        <p className="text-sm text-slate-500 text-center py-6">Devotee record not found.</p>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Action Restriction Warning for External Centre Devotees */}
          {!canTakeAction && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200/90 p-3 sm:p-3.5 text-amber-900 text-xs flex items-start sm:items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="font-bold">Read-Only View: Action Rights Restricted</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  You are viewing a devotee from another centre. As a Centre Administrator, you can only take action on devotees in your assigned centre.
                </p>
              </div>
            </div>
          )}

          {/* Header Summary: Responsive on Phone and Desktop */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md shadow-orange-500/20 shrink-0">
                {devotee.initiatedName?.[0] || devotee.legalName[0]}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 font-heading truncate">
                  {devotee.initiatedName || devotee.legalName}
                </h4>
                <p className="text-xs text-slate-500 truncate">Legal Name: {devotee.legalName}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 self-start sm:self-center">
              <Badge variant="amber" size="sm">
                {devotee.profileType}
              </Badge>
              <Badge variant="slate" size="sm">
                {devotee.initiationStatus || 'ASPIRANT'}
              </Badge>
            </div>
          </div>

          {/* Navigation Tabs: Fully responsive horizontal scroll for phones */}
          <div className="flex border-b border-slate-200 text-xs font-semibold overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap gap-1 pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
            <button
              onClick={() => handleTabChange('OVERVIEW')}
              className={`pb-2.5 pt-1 px-3 sm:px-4 flex items-center gap-1.5 transition-colors border-b-2 shrink-0 cursor-pointer ${
                activeTab === 'OVERVIEW'
                  ? 'border-amber-500 text-amber-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => handleTabChange('STUDENT')}
              className={`pb-2.5 pt-1 px-3 sm:px-4 flex items-center gap-1.5 transition-colors border-b-2 shrink-0 cursor-pointer ${
                activeTab === 'STUDENT'
                  ? 'border-amber-500 text-amber-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student Profile</span>
            </button>

            <button
              onClick={() => handleTabChange('PROFESSIONAL')}
              className={`pb-2.5 pt-1 px-3 sm:px-4 flex items-center gap-1.5 transition-colors border-b-2 shrink-0 cursor-pointer ${
                activeTab === 'PROFESSIONAL'
                  ? 'border-amber-500 text-amber-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Professional Profile</span>
            </button>

            <button
              onClick={() => handleTabChange('ALUMNI')}
              className={`pb-2.5 pt-1 px-3 sm:px-4 flex items-center gap-1.5 transition-colors border-b-2 shrink-0 cursor-pointer ${
                activeTab === 'ALUMNI'
                  ? 'border-amber-500 text-amber-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Alumni Profile</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {successMessage && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
              <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-semibold uppercase block text-[10px]">Spiritual Master</span>
                <span className="text-slate-800 font-medium text-sm mt-0.5 block truncate">
                  {devotee.spiritualMaster || 'Under guidance / Shelter pending'}
                </span>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-semibold uppercase block text-[10px]">Initiation Date</span>
                <span className="text-slate-800 font-medium text-sm mt-0.5 block flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {devotee.initiatedDate || 'Not applicable'}
                </span>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-semibold uppercase block text-[10px]">Phone Contact</span>
                <span className="text-slate-800 font-medium text-sm mt-0.5 block flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {devotee.phone || 'No phone recorded'}
                </span>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-semibold uppercase block text-[10px]">City & Region</span>
                <span className="text-slate-800 font-medium text-sm mt-0.5 block flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {devotee.city || 'N/A'}{devotee.state ? `, ${devotee.state}` : ''}
                </span>
              </div>

              <div className="sm:col-span-2 p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200">
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
                Track academic details, college institution, degree, and hostel status for student preaching engagement.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="College / University Name *"
                  placeholder="e.g. COEP Pune"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  disabled={!canTakeAction}
                  required
                />

                <Input
                  label="Degree / Course *"
                  placeholder="e.g. B.Tech / B.Sc"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  disabled={!canTakeAction}
                  required
                />

                <Input
                  label="Branch / Major"
                  placeholder="e.g. Computer Science"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  disabled={!canTakeAction}
                />

                <Input
                  label="Graduation Year"
                  type="number"
                  placeholder="2026"
                  value={gradYear}
                  onChange={(e) => setGradYear(e.target.value)}
                  disabled={!canTakeAction}
                />

                <Input
                  label="Current Year of Study (1 - 10)"
                  type="number"
                  placeholder="3"
                  value={currentYear}
                  onChange={(e) => setCurrentYear(e.target.value)}
                  disabled={!canTakeAction}
                />

                <Input
                  label="Student ID / Roll No"
                  placeholder="e.g. EN10492"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  disabled={!canTakeAction}
                />

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Accommodation Status
                  </label>
                  <select
                    value={hostel}
                    onChange={(e) => setHostel(e.target.value)}
                    disabled={!canTakeAction}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-amber-500 focus:ring-amber-500/20 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                  >
                    <option value="Hosteller">Hosteller (Living on Campus / PG / Youth Hostel)</option>
                    <option value="Day Scholar">Day Scholar (Living with Family / Home)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                {canTakeAction ? (
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={studentMutation.isPending}
                    className="w-full sm:w-auto font-semibold"
                  >
                    Save Student Profile
                  </Button>
                ) : (
                  <div className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium py-2.5 px-4 bg-slate-100 rounded-xl border border-slate-200">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Action restricted: External centre devotee</span>
                  </div>
                )}
              </div>
            </form>
          )}

          {/* TAB 3: PROFESSIONAL PROFILE */}
          {activeTab === 'PROFESSIONAL' && (
            <form onSubmit={handleSaveProfessional} className="space-y-4">
              <p className="text-xs text-slate-500">
                Track professional career, corporate company details, and work locations for professional devotee sangha.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="Company / Employer Name *"
                  placeholder="e.g. Infosys Ltd"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={!canTakeAction}
                  required
                />

                <Input
                  label="Designation / Role *"
                  placeholder="e.g. Lead Software Engineer"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  disabled={!canTakeAction}
                  required
                />

                <Input
                  label="Industry / Domain"
                  placeholder="e.g. Information Technology"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  disabled={!canTakeAction}
                />

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Employment Type
                  </label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    disabled={!canTakeAction}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-amber-500 focus:ring-amber-500/20 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="SELF_EMPLOYED">Self Employed / Business</option>
                    <option value="FREELANCE">Freelancer / Consultant</option>
                    <option value="INTERN">Intern</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <Input
                  label="Total Experience (Years)"
                  type="number"
                  placeholder="3"
                  value={totalExp}
                  onChange={(e) => setTotalExp(e.target.value)}
                  disabled={!canTakeAction}
                />

                <Input
                  label="Annual Income Range"
                  placeholder="e.g. 10-15 LPA"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(e.target.value)}
                  disabled={!canTakeAction}
                />

                <Input
                  label="Work City"
                  placeholder="e.g. Pune / Bengaluru"
                  value={workCity}
                  onChange={(e) => setWorkCity(e.target.value)}
                  disabled={!canTakeAction}
                />

                <Input
                  label="LinkedIn Profile URL"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  leftIcon={<Globe className="w-4 h-4 text-slate-400" />}
                  disabled={!canTakeAction}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="profMentor"
                  checked={isMentorWilling}
                  onChange={(e) => setIsMentorWilling(e.target.checked)}
                  disabled={!canTakeAction}
                  className="rounded text-amber-600 focus:ring-amber-500 disabled:opacity-50 cursor-pointer"
                />
                <label htmlFor="profMentor" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Willing to mentor students and junior working professionals in career guidance
                </label>
              </div>

              <div className="flex justify-end pt-3">
                {canTakeAction ? (
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={profMutation.isPending}
                    className="w-full sm:w-auto font-semibold"
                  >
                    Save Professional Profile
                  </Button>
                ) : (
                  <div className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium py-2.5 px-4 bg-slate-100 rounded-xl border border-slate-200">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Action restricted: External centre devotee</span>
                  </div>
                )}
              </div>
            </form>
          )}

          {/* TAB 4: ALUMNI PROFILE */}
          {activeTab === 'ALUMNI' && (
            <form onSubmit={handleSaveAlumni} className="space-y-4">
              <p className="text-xs text-slate-500">
                Track alumni records, graduation year, career achievements, and mentorship for younger youth devotees.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="Highest Degree Obtained"
                  placeholder="e.g. M.Tech / MBA / Ph.D"
                  value={highestDegree}
                  onChange={(e) => setHighestDegree(e.target.value)}
                  disabled={!canTakeAction}
                />

                <Input
                  label="Alumni Alma Mater / Institution"
                  placeholder="e.g. IIT Bombay / Pune University"
                  value={alumniInstitution}
                  onChange={(e) => setAlumniInstitution(e.target.value)}
                  disabled={!canTakeAction}
                />

                <Input
                  label="Graduation Year"
                  type="number"
                  placeholder="2022"
                  value={alumniGradYear}
                  onChange={(e) => setAlumniGradYear(e.target.value)}
                  disabled={!canTakeAction}
                />

                <Input
                  label="Current Organization / Company"
                  placeholder="e.g. Google India"
                  value={currentOrg}
                  onChange={(e) => setCurrentOrg(e.target.value)}
                  disabled={!canTakeAction}
                />

                <Input
                  label="Current Profession"
                  placeholder="e.g. Senior Data Scientist"
                  value={alumniProfession}
                  onChange={(e) => setAlumniProfession(e.target.value)}
                  disabled={!canTakeAction}
                />

                <Input
                  label="City of Residence"
                  placeholder="e.g. Mumbai"
                  value={alumniCity}
                  onChange={(e) => setAlumniCity(e.target.value)}
                  disabled={!canTakeAction}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="alumniMentor"
                  checked={mentorshipOffered}
                  onChange={(e) => setMentorshipOffered(e.target.checked)}
                  disabled={!canTakeAction}
                  className="rounded text-amber-600 focus:ring-amber-500 disabled:opacity-50 cursor-pointer"
                />
                <label htmlFor="alumniMentor" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Available to mentor current college youth members and participate in alumni sangha
                </label>
              </div>

              <div className="flex justify-end pt-3">
                {canTakeAction ? (
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={alumniMutation.isPending}
                    className="w-full sm:w-auto font-semibold"
                  >
                    Save Alumni Profile
                  </Button>
                ) : (
                  <div className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium py-2.5 px-4 bg-slate-100 rounded-xl border border-slate-200">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Action restricted: External centre devotee</span>
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
