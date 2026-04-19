export interface BondedWarehouse {
  id: number;
  code: string;
  name: string;
  description: string | null;
  createdAt: string;
  secuencia: number | null;
  tipoLocalizacion: string | null;
  centroLogistico: string | null;
  ubicacionArea: string | null;
  paisOrigen: string | null;
  active: boolean;
}

export interface CreateBondedWarehouseRequest {
  code: string;
  name: string;
  description?: string;
  secuencia?: number | null;
  tipoLocalizacion?: string | null;
  centroLogistico?: string | null;
  ubicacionArea?: string | null;
  paisOrigen?: string | null;
}

export type { CsvImportResponse } from './shared.model';
