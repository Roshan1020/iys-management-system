export type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

export interface UserResponse {
  id: string;
  centreId: string;
  email: string;
  phone?: string;
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string;
  roles: string[];
  permissions: string[];
}

export interface AssignRoleRequest {
  roleId?: string;
  roleName?: string;
  centreId?: string;
}

export interface RoleResponse {
  id: string;
  name: string;
  description?: string;
  centreId?: string;
  isSystemRole: boolean;
}
