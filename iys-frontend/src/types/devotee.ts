export type ProfileType = 'STUDENT' | 'WORKING_PROFESSIONAL' | 'ALUMNI' | 'OTHER';

export interface DevoteeSummaryResponse {
  id: string;
  centreId: string;
  legalName: string;
  initiatedName?: string;
  profileType: ProfileType;
  initiationStatus?: string;
  city?: string;
  createdAt: string;
}

export interface StudentProfileDto {
  id?: string;
  institution?: string;
  course?: string;
  specialisation?: string;
  yearOfStudy?: number;
  expectedGraduation?: string;
  studentIdNumber?: string;
  hostelResident?: boolean;
  // Aliases
  collegeName?: string;
  degree?: string;
  branch?: string;
  currentYear?: number;
  graduationYear?: number;
  hostelOrDayScholar?: string;
}

export interface ProfessionalProfileDto {
  id?: string;
  company?: string;
  designation?: string;
  industry?: string;
  employmentType?: string;
  experienceYears?: number;
  annualIncomeRange?: string;
  linkedinUrl?: string;
  isMentorWilling?: boolean;
  // Aliases
  companyName?: string;
  totalExpYears?: number;
  workCity?: string;
  mentorshipOffered?: boolean;
}

export interface AlumniProfileDto {
  id?: string;
  graduationYear?: number;
  institution?: string;
  degree?: string;
  currentProfession?: string;
  currentCompany?: string;
  cityOfResidence?: string;
  isActiveDevotee?: boolean;
  wantsToConnect?: boolean;
  // Aliases
  highestDegree?: string;
  currentOrganization?: string;
  mentorshipOffered?: boolean;
}

export interface DevoteeResponse {
  id: string;
  userId?: string;
  centreId: string;
  legalName: string;
  initiatedName?: string;
  spiritualMaster?: string;
  initiationStatus?: string;
  initiatedDate?: string;
  dob?: string;
  gender?: string;
  profileType: ProfileType;
  profilePhotoUrl?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  joinDate?: string;
  isRegular: boolean;
  notes?: string;
  studentProfile?: StudentProfileDto;
  professionalProfile?: ProfessionalProfileDto;
  alumniProfile?: AlumniProfileDto;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDevoteeRequest {
  userId?: string;
  email?: string;
  centreId: string;
  legalName: string;
  initiatedName?: string;
  profileType: ProfileType;
  initiationStatus?: string;
  phone?: string;
  city?: string;
  gender?: string;
  dob?: string;
  notes?: string;
}

export interface UpdateDevoteeRequest {
  centreId?: string;
  legalName?: string;
  initiatedName?: string;
  spiritualMaster?: string;
  initiationStatus?: string;
  dob?: string;
  gender?: string;
  profileType?: ProfileType;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isRegular?: boolean;
  notes?: string;
}

export interface StudentProfileRequest {
  institution?: string;
  course?: string;
  specialisation?: string;
  yearOfStudy?: number;
  expectedGraduation?: string;
  studentIdNumber?: string;
  hostelResident?: boolean;
  // Aliases
  collegeName?: string;
  degree?: string;
  branch?: string;
  graduationYear?: number;
  currentYear?: number;
  hostelOrDayScholar?: string;
}

export interface ProfessionalProfileRequest {
  company?: string;
  designation?: string;
  industry?: string;
  employmentType?: string;
  experienceYears?: number;
  annualIncomeRange?: string;
  linkedinUrl?: string;
  isMentorWilling?: boolean;
  // Aliases
  companyName?: string;
  totalExpYears?: number;
  workCity?: string;
  mentorshipOffered?: boolean;
}

export interface AlumniProfileRequest {
  graduationYear?: number;
  institution?: string;
  degree?: string;
  currentProfession?: string;
  currentCompany?: string;
  cityOfResidence?: string;
  isActiveDevotee?: boolean;
  wantsToConnect?: boolean;
  // Aliases
  highestDegree?: string;
  currentOrganization?: string;
  mentorshipOffered?: boolean;
}
