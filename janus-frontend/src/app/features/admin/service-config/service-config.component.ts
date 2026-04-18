import { Component, inject, OnInit, signal, computed } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ServiceService } from '../../../core/services/service.service';
import { ServiceConfig, CreateServiceRequest, UpdateServiceRequest, ServiceModule } from '../../../core/models/service.model';
import { CsvImportResponse } from '../../../core/models/shared.model';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-service-config',
  standalone: true,
  imports: [FormsModule, TranslateModule, PaginationComponent],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>{{ 'SERVICE_CONFIG.TITLE' | translate }}</h2>
      <div class="d-flex gap-2 align-items-center flex-wrap">
        <button class="btn btn-outline-secondary btn-sm" (click)="onExportCsv()">{{ 'SERVICE_CONFIG.EXPORT_CSV' | translate }}</button>
        <button class="btn btn-outline-secondary btn-sm" (click)="onDownloadTemplate()">{{ 'SERVICE_CONFIG.DOWNLOAD_TEMPLATE' | translate }}</button>
        <label class="btn btn-outline-secondary btn-sm mb-0" [class.disabled]="importing()">
          {{ importing() ? '...' : ('SERVICE_CONFIG.IMPORT_CSV' | translate) }}
          <input type="file" accept=".csv" class="d-none" (change)="onImportCsv($event)">
        </label>
        <button class="btn btn-primary btn-sm" (click)="toggleCreateForm()">
          <i class="bi bi-plus-lg me-1"></i>
          {{ 'SERVICE_CONFIG.ADD' | translate }}
        </button>
      </div>
    </div>

    @if (loading()) {
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">{{ 'COMMON.LOADING' | translate }}</span>
        </div>
      </div>
    } @else if (error()) {
      <div class="alert alert-danger" role="alert">
        {{ error() }}
      </div>
    } @else {
      @if (successMessage()) {
        <div class="alert alert-success alert-dismissible fade show" role="alert">
          {{ successMessage() | translate }}
          <button type="button" class="btn-close" (click)="successMessage.set('')"></button>
        </div>
      }

      @if (showCreateForm()) {
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="mb-0">{{ 'SERVICE_CONFIG.ADD' | translate }}</h5>
          </div>
          <div class="card-body">
            <form (ngSubmit)="submitCreate()" #createForm="ngForm">
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label">{{ 'SERVICE_CONFIG.NAME' | translate }}</label>
                  <input type="text" class="form-control" [(ngModel)]="newService.name" name="name" required
                         placeholder="e.g. LABOR" style="text-transform: uppercase;" />
                </div>
                <div class="col-md-4">
                  <label class="form-label">{{ 'SERVICE_CONFIG.LABEL_ES' | translate }}</label>
                  <input type="text" class="form-control" [(ngModel)]="newService.labelEs" name="labelEs" required />
                </div>
                <div class="col-md-4">
                  <label class="form-label">{{ 'SERVICE_CONFIG.LABEL_EN' | translate }}</label>
                  <input type="text" class="form-control" [(ngModel)]="newService.labelEn" name="labelEn" required />
                </div>
              </div>
              <div class="row g-3 mt-1">
                <div class="col-12">
                  <label class="form-label">{{ 'SERVICE_CONFIG.APPLIES_TO' | translate }}</label>
                  <div class="d-flex gap-3">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="create-logistics"
                             [(ngModel)]="newServiceLogistics" name="logistics" />
                      <label class="form-check-label" for="create-logistics">{{ 'SERVICE_CONFIG.MODULE_LOGISTICS' | translate }}</label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="create-cargo"
                             [(ngModel)]="newServiceCargo" name="cargo" />
                      <label class="form-check-label" for="create-cargo">{{ 'SERVICE_CONFIG.MODULE_CARGO' | translate }}</label>
                    </div>
                  </div>
                </div>
              </div>
              <div class="mt-3 d-flex gap-2">
                <button type="submit" class="btn btn-success" [disabled]="!createForm.valid">
                  {{ 'ACTIONS.SAVE' | translate }}
                </button>
                <button type="button" class="btn btn-outline-secondary" (click)="toggleCreateForm()">
                  {{ 'ACTIONS.CANCEL' | translate }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <div class="card">
        <div class="card-body p-0 table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>ID</th>
                <th>{{ 'SERVICE_CONFIG.NAME' | translate }}</th>
                <th>{{ 'SERVICE_CONFIG.LABEL_ES' | translate }}</th>
                <th>{{ 'SERVICE_CONFIG.LABEL_EN' | translate }}</th>
                <th>{{ 'SERVICE_CONFIG.SORT_ORDER' | translate }}</th>
                <th>{{ 'SERVICE_CONFIG.APPLIES_TO' | translate }}</th>
                <th>{{ 'COMMON.STATUS' | translate }}</th>
                <th>{{ 'COMMON.ACTIONS' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (cat of pagedServices(); track cat.id) {
                <tr>
                  <td class="text-muted small">{{ cat.id }}</td>
                  <td><code>{{ cat.name }}</code></td>
                  <td>
                    @if (editingId() === cat.id) {
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="editLabelEs"
                             (keyup.escape)="cancelEdit()" />
                    } @else {
                      {{ cat.labelEs }}
                    }
                  </td>
                  <td>
                    @if (editingId() === cat.id) {
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="editLabelEn"
                             (keyup.escape)="cancelEdit()" />
                    } @else {
                      {{ cat.labelEn }}
                    }
                  </td>
                  <td>
                    @if (editingId() === cat.id) {
                      <input type="number" class="form-control form-control-sm" [(ngModel)]="editSortOrder"
                             style="width: 80px;" (keyup.enter)="saveEdit(cat)" (keyup.escape)="cancelEdit()" />
                    } @else {
                      {{ cat.sortOrder }}
                    }
                  </td>
                  <td>
                    @if (editingId() === cat.id) {
                      <div class="d-flex gap-2">
                        <div class="form-check">
                          <input class="form-check-input" type="checkbox" [id]="'edit-logistics-' + cat.id"
                                 [(ngModel)]="editLogistics" />
                          <label class="form-check-label" [for]="'edit-logistics-' + cat.id">{{ 'SERVICE_CONFIG.MODULE_LOGISTICS' | translate }}</label>
                        </div>
                        <div class="form-check">
                          <input class="form-check-input" type="checkbox" [id]="'edit-cargo-' + cat.id"
                                 [(ngModel)]="editCargo" />
                          <label class="form-check-label" [for]="'edit-cargo-' + cat.id">{{ 'SERVICE_CONFIG.MODULE_CARGO' | translate }}</label>
                        </div>
                      </div>
                    } @else {
                      @for (module of cat.appliesTo; track module) {
                        <span class="badge bg-info me-1">{{ 'SERVICE_CONFIG.MODULE_' + module | translate }}</span>
                      }
                    }
                  </td>
                  <td>
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" role="switch"
                             [checked]="cat.active" (change)="toggleActive(cat)"
                             [id]="'switch-' + cat.id" />
                      <label class="form-check-label" [for]="'switch-' + cat.id">
                        {{ (cat.active ? 'SERVICE_CONFIG.ACTIVE' : 'SERVICE_CONFIG.INACTIVE') | translate }}
                      </label>
                    </div>
                  </td>
                  <td>
                    @if (editingId() === cat.id) {
                      <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-success" (click)="saveEdit(cat)">{{ 'ACTIONS.SAVE' | translate }}</button>
                        <button class="btn btn-sm btn-outline-secondary" (click)="cancelEdit()">{{ 'ACTIONS.CANCEL' | translate }}</button>
                      </div>
                    } @else {
                      <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-outline-primary" (click)="startEdit(cat)">{{ 'ACTIONS.EDIT' | translate }}</button>
                        <button class="btn btn-sm btn-outline-danger" (click)="deleteService(cat)">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="8" class="text-center text-muted py-4">{{ 'COMMON.NO_DATA' | translate }}</td></tr>
              }
            </tbody>
          </table>
        </div>
        <app-pagination
          [currentPage]="currentPage()"
          [pageSize]="pageSize"
          [totalElements]="services().length"
          [totalPages]="totalPages()"
          (pageChange)="onPageChange($event)" />
      </div>

      @if (importResult()) {
        <div class="alert alert-info mt-3 alert-dismissible fade show">
          {{ 'SERVICE_CONFIG.IMPORT_SUCCESS' | translate:{imported: importResult()!.imported, skipped: importResult()!.skipped} }}
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
    }
  `
})
export class ServiceConfigComponent implements OnInit {
  private serviceService = inject(ServiceService);
  private translate = inject(TranslateService);

  services = signal<ServiceConfig[]>([]);
  loading = signal(true);
  error = signal('');
  successMessage = signal('');
  editingId = signal<number | null>(null);
  showCreateForm = signal(false);
  currentPage = signal(1);
  pageSize = 10;
  importing = signal(false);
  importResult = signal<CsvImportResponse | null>(null);

  pagedServices = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.services().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.services().length / this.pageSize));

  editLabelEs = '';
  editLabelEn = '';
  editSortOrder = 0;
  editLogistics = true;
  editCargo = true;

  newServiceLogistics = true;
  newServiceCargo = true;

  newService: Partial<CreateServiceRequest> = this.emptyService();

  ngOnInit(): void {
    this.loadServices();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  onExportCsv(): void {
    this.serviceService.exportCsv().subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'services.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  onDownloadTemplate(): void {
    const content = [
      'name,labelEs,labelEn,sortOrder,appliesTo',
      'FUMIGACION,"Fumigación","Fumigation",1,"LOGISTICS;CARGO"'
    ].join('\r\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'services-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  onImportCsv(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.importing.set(true);
    this.serviceService.importCsv(file).subscribe({
      next: result => {
        this.importResult.set(result);
        this.importing.set(false);
        this.loadServices();
      },
      error: () => { this.importing.set(false); }
    });
    (event.target as HTMLInputElement).value = '';
  }

  toggleCreateForm(): void {
    this.showCreateForm.update(v => !v);
    if (this.showCreateForm()) {
      this.newService = this.emptyService();
      this.newServiceLogistics = true;
      this.newServiceCargo = true;
    }
  }

  submitCreate(): void {
    const appliesTo: ServiceModule[] = [];
    if (this.newServiceLogistics) appliesTo.push('LOGISTICS');
    if (this.newServiceCargo) appliesTo.push('CARGO');
    const request: CreateServiceRequest = {
      name: (this.newService.name || '').toUpperCase(),
      labelEs: this.newService.labelEs || '',
      labelEn: this.newService.labelEn || '',
      appliesTo
    };
    this.serviceService.create(request).subscribe({
      next: () => {
        this.showCreateForm.set(false);
        this.newService = this.emptyService();
        this.loadServices();
        this.showSuccess('SERVICE_CONFIG.CREATED');
      },
      error: () => this.error.set('Error creating service')
    });
  }

  deleteService(cat: ServiceConfig): void {
    var message = '';
    this.translate.get('SERVICE_CONFIG.DELETE_CONFIRM').subscribe(t => message = t);
    if (!confirm(message)) {
      return;
    }
    this.serviceService.delete(cat.id).subscribe({
      next: () => {
        this.loadServices();
        this.showSuccess('SERVICE_CONFIG.DELETED');
      },
      error: () => this.error.set('Error deleting service')
    });
  }

  toggleActive(cat: ServiceConfig): void {
    this.serviceService.toggle(cat.id).subscribe({
      next: () => {
        this.loadServices();
        this.successMessage.set('');
      },
      error: () => this.error.set('Error toggling service')
    });
  }

  startEdit(cat: ServiceConfig): void {
    this.editingId.set(cat.id);
    this.editLabelEs = cat.labelEs;
    this.editLabelEn = cat.labelEn;
    this.editSortOrder = cat.sortOrder;
    this.editLogistics = cat.appliesTo.includes('LOGISTICS');
    this.editCargo = cat.appliesTo.includes('CARGO');
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editLabelEs = '';
    this.editLabelEn = '';
    this.editSortOrder = 0;
    this.editLogistics = true;
    this.editCargo = true;
  }

  saveEdit(cat: ServiceConfig): void {
    const appliesTo: ServiceModule[] = [];
    if (this.editLogistics) appliesTo.push('LOGISTICS');
    if (this.editCargo) appliesTo.push('CARGO');
    const request: UpdateServiceRequest = {
      labelEs: this.editLabelEs,
      labelEn: this.editLabelEn,
      sortOrder: this.editSortOrder,
      appliesTo
    };
    this.serviceService.update(cat.id, request).subscribe({
      next: () => {
        this.editingId.set(null);
        this.loadServices();
        this.showSuccess('SERVICE_CONFIG.UPDATED');
      },
      error: () => this.error.set('Error updating service')
    });
  }

  private loadServices(): void {
    this.loading.set(true);
    this.serviceService.getAll().subscribe({
      next: services => {
        this.services.set(services);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error loading services');
        this.loading.set(false);
      }
    });
  }

  private showSuccess(key: string): void {
    this.successMessage.set(key);
    setTimeout(() => this.successMessage.set(''), 3000);
  }

  private emptyService(): Partial<CreateServiceRequest> {
    return { name: '', labelEs: '', labelEn: '' };
  }
}
