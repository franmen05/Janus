export enum Role {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  ACCOUNTING = 'ACCOUNTING',
  CLIENT = 'CLIENT',
  CARRIER = 'CARRIER'
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  active: boolean;
  clientId: number | null;
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: Role;
  clientId: number | null;
}

export interface UpdateUserRequest {
  fullName: string;
  email: string;
  role: Role;
  clientId: number | null;
  active: boolean;
  password: string | null;
}
