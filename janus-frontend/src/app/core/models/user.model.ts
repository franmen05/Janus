export enum Role {
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  AGENT = 'AGENT',
  ACCOUNTING = 'ACCOUNTING',
  CUSTOMER = 'CUSTOMER',
  CARRIER = 'CARRIER'
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  roles: string[];
  active: boolean;
  accountId: number | null;
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName: string;
  email: string;
  roles: Role[];
  accountId: number | null;
}

export interface UpdateUserRequest {
  fullName: string;
  email: string;
  roles: Role[];
  accountId: number | null;
  active: boolean;
  password: string | null;
}
