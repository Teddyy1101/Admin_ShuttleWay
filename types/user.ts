export type Role = 'ADMIN' | 'DRIVER' | 'PARENT' | 'STUDENT';
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  avatarUrl?: string | null;
  phone?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
  isActive?: boolean;
}
