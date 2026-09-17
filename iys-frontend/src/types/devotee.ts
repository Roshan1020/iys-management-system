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
  collegeName: string;
  degree: string;
  branch?: string;
  graduationYear?: number;
  currentYear?: number;
  hostelOrDayScholar?: string;
}

export interface ProfessionalProfileRequest {
  companyName: string;
  designation: string;
  industry?: string;
  totalExpYears?: number;
  workCity?: string;
}

export interface AlumniProfileRequest {
  highestDegree?: string;
  currentOrganization?: string;
  mentorshipOffered?: boolean;
}
