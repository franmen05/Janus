export interface CsvImportResponse {
  imported: number;
  updated: number;
  duplicates: number;
  skipped: number;
  errors: string[];
}
