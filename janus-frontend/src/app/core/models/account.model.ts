export enum AccountType {
  COMPANY = 'COMPANY',
  CONSIGNEE = 'CONSIGNEE',
  INDIVIDUAL = 'INDIVIDUAL',
  SHIPPER = 'SHIPPER',
  CARRIER = 'CARRIER'
}

export type DocumentType = 'RNC' | 'CEDULA' | 'PASSPORT';

export interface Account {
  id: number;
  name: string;
  taxId: string;
  email: string;
  phone: string | null;
  address: string | null;
  accountTypes: AccountType[];
  active: boolean;
  createdAt: string;
  businessName: string | null;
  representative: string | null;
  documentType: DocumentType | null;
  alternatePhone: string | null;
  country: string | null;
  accountCode: string | null;
  notes: string | null;
  contacts: AccountContact[];
}

export enum ContactType {
  PRIMARY = 'PRIMARY',
  ALTERNATE = 'ALTERNATE'
}

export interface AccountContact {
  id: number;
  firstName: string;
  lastName: string;
  identification: string;
  phone: string;
  email: string | null;
  contactType: ContactType;
  receiveNotifications: boolean;
  createdAt: string;
}

export interface CreateAccountContactRequest {
  firstName: string;
  lastName: string;
  identification: string;
  phone: string;
  email?: string;
  contactType: ContactType;
  receiveNotifications: boolean;
}

export interface CreateAccountRequest {
  name: string;
  taxId: string;
  email: string;
  accountTypes: AccountType[];
  phone?: string;
  address?: string;
  businessName?: string;
  representative?: string;
  documentType?: DocumentType;
  alternatePhone?: string;
  country?: string;
  accountCode?: string;
  notes?: string;
}
