export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  legalName: string;
  centreId: string;
  phone?: string;
  initiatedName?: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresInMs: number;
  userId: string;
  email: string;
  centreId: string;
  roles: string[];
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserSession {
  userId: string;
  email: string;
  centreId: string;
  roles: string[];
}
