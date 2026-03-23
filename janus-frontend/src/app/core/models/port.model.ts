export interface Port {
  id: number;
  code: string;
  name: string;
  description: string | null;
  address: string | null;
  country: string | null;
  createdAt: string;
}

export interface CreatePortRequest {
  code: string;
  name: string;
  description?: string;
  address?: string;
  country?: string;
}

export interface CatalogCountry {
  code: string;
  name: string;
  nameEs: string;
}

export interface CatalogPort {
  code: string;
  name: string;
  alreadyLoaded: boolean;
}

export interface BulkImportRequest {
  country: string;
  ports: { code: string; name: string }[];
}

export interface BulkImportResponse {
  imported: number;
  skipped: number;
}
