export interface CsvImportResponse {
  imported: number;
  skipped: number;
  errors: string[];
}
