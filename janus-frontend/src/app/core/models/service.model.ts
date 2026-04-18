export type ServiceModule = 'LOGISTICS' | 'CARGO';

export interface ServiceConfig {
  id: number;
  name: string;
  labelEs: string;
  labelEn: string;
  active: boolean;
  sortOrder: number;
  appliesTo: ServiceModule[];
  defaultPrice?: number | null;
  defaultCurrency?: string | null;
  createdAt: string;
}

export interface CreateServiceRequest {
  name: string;
  labelEs: string;
  labelEn: string;
  appliesTo?: ServiceModule[];
  defaultPrice?: number | null;
  defaultCurrency?: string | null;
}

export interface UpdateServiceRequest {
  labelEs: string;
  labelEn: string;
  sortOrder: number;
  appliesTo?: ServiceModule[];
  defaultPrice?: number | null;
  defaultCurrency?: string | null;
}
