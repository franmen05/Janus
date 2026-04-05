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
  role: string;
  active: boolean;
  customerId: number | null;
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: Role;
  customerId: number | null;
}

export interface UpdateUserRequest {
  fullName: string;
  email: string;
  role: Role;
  customerId: number | null;
  active: boolean;
  password: string | null;
}
