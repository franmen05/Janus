export interface Warehouse {
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

export interface CreateWarehouseRequest {
  code: string;
  name: string;
  description?: string;
  secuencia?: number | null;
  tipoLocalizacion?: string | null;
  centroLogistico?: string | null;
  ubicacionArea?: string | null;
  paisOrigen?: string | null;
}

export interface CsvImportResponse {
  imported: number;
  skipped: number;
  errors: string[];
}
