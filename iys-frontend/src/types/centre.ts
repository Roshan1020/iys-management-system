export interface CentreResponse {
  id: string;
  name: string;
  shortCode: string;
  city: string;
  state?: string;
  country: string;
  timezone?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
  isActive?: boolean;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCentreRequest {
  name: string;
  shortCode: string;
  city: string;
  state?: string;
  country: string;
  timezone?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateCentreRequest {
  name?: string;
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive?: boolean;
}
