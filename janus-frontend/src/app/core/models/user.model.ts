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
