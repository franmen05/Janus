import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { Warehouse, CsvImportResponse } from '../../../core/models/warehouse.model';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingIndicatorComponent } from '../../../shared/components/loading-indicator/loading-indicator.component';

@Component({
  selector: 'app-warehouse-list',
  standalone: true,
  imports: [RouterModule, FormsModule, TranslateModule, LoadingIndicatorComponent],
  template: `
    <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-4">
      <h2>{{ 'WAREHOUSES.TITLE' | translate }}</h2>
      <div class="d-flex gap-3 align-items-center">
        <div class="form-check form-switch mb-0">
          <input class="form-check-input" type="checkbox" id="showInactiveToggle"
                 [checked]="showInactive()"
                 (change)="toggleShowInactive()">
          <label class="form-check-label" for="showInactiveToggle">{{ 'WAREHOUSES.SHOW_INACTIVE' | translate }}</label>
        </div>
        <button class="btn btn-outline-secondary btn-sm" (click)="onExportCsv()">{{ 'WAREHOUSES.EXPORT_CSV' | translate }}</button>
        <button class="btn btn-outline-secondary btn-sm" (click)="onDownloadTemplate()">{{ 'WAREHOUSES.DOWNLOAD_TEMPLATE' | translate }}</button>
        <label class="btn btn-outline-secondary btn-sm mb-0" [class.disabled]="importing()">
          {{ importing() ? '...' : ('WAREHOUSES.IMPORT_CSV' | translate) }}
          <input type="file" accept=".csv" class="d-none" (change)="onImportCsv($event)">
        </label>
        @if (authService.hasRole(['ADMIN', 'SUPERVISOR'])) {
          <a routerLink="/warehouses/new" class="btn btn-primary">{{ 'WAREHOUSES.NEW' | translate }}</a>
        }
      </div>
    </div>
    @if (loading()) {
      <app-loading-indicator />
    } @else {
    <div class="card">
      <div class="card-header">
        <input type="text" class="form-control"
               [placeholder]="'WAREHOUSES.SEARCH' | translate"
               [ngModel]="searchTerm()"
               (ngModelChange)="searchTerm.set($event)">
      </div>
      <div class="card-body p-0 table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>{{ 'WAREHOUSES.CODE' | translate }}</th>
              <th>{{ 'WAREHOUSES.NAME' | translate }}</th>
              <th class="d-none d-md-table-cell">{{ 'WAREHOUSES.DESCRIPTION' | translate }}</th>
              <th class="d-none d-lg-table-cell">{{ 'WAREHOUSES.SECUENCIA' | translate }}</th>
              <th class="d-none d-lg-table-cell">{{ 'WAREHOUSES.TIPO_LOCALIZACION' | translate }}</th>
              <th class="d-none d-xl-table-cell">{{ 'WAREHOUSES.CENTRO_LOGISTICO' | translate }}</th>
              <th class="d-none d-xl-table-cell">{{ 'WAREHOUSES.PAIS_ORIGEN' | translate }}</th>
              <th>{{ 'COMMON.ACTIONS' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (dep of filteredWarehouses(); track dep.id) {
              <tr [class.table-secondary]="!dep.active" [class.opacity-75]="!dep.active">
                <td class="fw-bold">{{ dep.code }}</td>
                <td>
                  {{ dep.name }}
                  @if (!dep.active) {
                    <span class="badge bg-secondary ms-1">{{ 'WAREHOUSES.INACTIVE_BADGE' | translate }}</span>
                  }
                </td>
                <td class="d-none d-md-table-cell text-truncate" style="max-width: 300px;" [title]="dep.description ?? ''">{{ dep.description ?? '-' }}</td>
                <td class="d-none d-lg-table-cell">{{ dep.secuencia ?? '-' }}</td>
                <td class="d-none d-lg-table-cell">{{ dep.tipoLocalizacion ?? '-' }}</td>
                <td class="d-none d-xl-table-cell">{{ dep.centroLogistico ?? '-' }}</td>
                <td class="d-none d-xl-table-cell">{{ dep.paisOrigen ?? '-' }}</td>
                <td>
                  <div class="d-flex gap-1 flex-wrap">
                    @if (authService.hasRole(['ADMIN', 'SUPERVISOR'])) {
                      <a [routerLink]="['/warehouses', dep.id, 'edit']" class="btn btn-sm btn-outline-primary">{{ 'ACTIONS.EDIT' | translate }}</a>
                      <button class="btn btn-sm btn-outline-warning" (click)="onToggleActive(dep)">
                        {{ (dep.active ? 'WAREHOUSES.INACTIVATE' : 'WAREHOUSES.ACTIVATE') | translate }}
                      </button>
                      <button class="btn btn-sm btn-outline-danger" (click)="onDelete(dep)">
                        {{ 'WAREHOUSES.DELETE' | translate }}
                      </button>
                    }
                  </div>
                </td>
              </tr>
            }
            @empty {
              <tr><td colspan="8" class="text-center text-muted py-3">{{ 'WAREHOUSES.NO_WAREHOUSES' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
    }
    @if (importResult()) {
      <div class="alert alert-info mt-3 alert-dismissible fade show">
        {{ 'WAREHOUSES.IMPORT_SUCCESS' | translate:{imported: importResult()!.imported, skipped: importResult()!.skipped} }}
        @if (importResult()!.errors.length > 0) {
          <ul class="mb-0 mt-1">
            @for (err of importResult()!.errors; track err) {
              <li>{{ err }}</li>
            }
          </ul>
        }
        <button type="button" class="btn-close" (click)="importResult.set(null)"></button>
      </div>
    }
  `
})
export class WarehouseListComponent implements OnInit {
  private warehouseService = inject(WarehouseService);
  private translate = inject(TranslateService);
  authService = inject(AuthService);
  loading = signal(true);
  warehouses = signal<Warehouse[]>([]);
  searchTerm = signal('');
  showInactive = signal(false);
  importing = signal(false);
  importResult = signal<CsvImportResponse | null>(null);

  filteredWarehouses = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.warehouses();
    return this.warehouses().filter(d =>
      d.code.toLowerCase().includes(term) ||
      d.name.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.loadWarehouses();
  }

  toggleShowInactive(): void {
    this.showInactive.update(v => !v);
    this.loadWarehouses();
  }

  onToggleActive(warehouse: Warehouse): void {
    if (warehouse.active && !confirm(this.translate.instant('WAREHOUSES.CONFIRM_INACTIVATE'))) return;
    this.warehouseService.toggleActive(warehouse.id).subscribe({
      next: () => this.loadWarehouses(),
      error: (err) => {
        const errorCode = err.error?.errorCode;
        const message = errorCode
          ? this.translate.instant('ERRORS.' + errorCode)
          : (err.error?.error ?? this.translate.instant('ERRORS.GENERIC_ERROR'));
        alert(message);
      }
    });
  }

  onDownloadTemplate(): void {
    const content = [
      'code,name,description,secuencia,tipoLocalizacion,centroLogistico,ubicacionArea,paisOrigen',
      'WH001,Main Warehouse,Main storage facility,1,INTERIOR,CL-NORTE,Zona A,DO'
    ].join('\r\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'warehouses-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  onExportCsv(): void {
    this.warehouseService.exportCsv(this.showInactive()).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'warehouses.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  onImportCsv(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.importing.set(true);
    this.warehouseService.importCsv(file).subscribe({
      next: result => {
        this.importResult.set(result);
        this.importing.set(false);
        this.loadWarehouses();
      },
      error: () => { this.importing.set(false); }
    });
    (event.target as HTMLInputElement).value = '';
  }

  onDelete(warehouse: Warehouse): void {
    if (!confirm(this.translate.instant('WAREHOUSES.CONFIRM_DELETE'))) return;
    this.warehouseService.delete(warehouse.id).subscribe({
      next: () => this.loadWarehouses(),
      error: (err) => {
        const errorCode = err.error?.errorCode;
        const message = errorCode
          ? this.translate.instant('ERRORS.' + errorCode)
          : (err.error?.error ?? this.translate.instant('ERRORS.GENERIC_ERROR'));
        alert(message);
      }
    });
  }

  private loadWarehouses(): void {
    this.loading.set(true);
    this.warehouseService.getAll(this.showInactive()).subscribe({
      next: warehouses => { this.warehouses.set(warehouses); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }
}
