import type { Organization } from './organization.interface';

export type RoleType = 'owner' | 'staff' | 'admin' | 'SUPER_ADMIN' | 'BUSINESS_OWNER' | 'STAFF';

export interface User {
  id: string;
  email: string;
  fullName: string;
  name?: string;
  phoneNumber?: string;
  phone?: string;
  avatarUrl?: string;
  avatar?: string;
  systemRole: string;
  role?: string;
  roleTitle?: string;
  twoFactorEnabled?: boolean;
  isTwoFactorEnabled?: boolean;
  isSuperAdmin?: boolean;
  createdAt: string;
  [key: string]: any;
}

export interface Membership {
  id: string;
  organizationId: string;
  userId: string;
  role: RoleType;
  departmentId?: string;
  status: string;
  organization?: Organization;
  department?: { id: string; name: string; code: string };
  user?: User;
}
