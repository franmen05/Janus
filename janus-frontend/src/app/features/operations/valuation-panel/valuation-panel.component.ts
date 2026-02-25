import { Component, input, output, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ValuationService } from '../../../core/services/valuation.service';
import { AuthService } from '../../../core/services/auth.service';
import { Operation } from '../../../core/models/operation.model';
import {
  ExternalPermit, ExternalPermitRequest, ExternalPermitType, ExternalPermitStatus,
  ValuationChecklist, GattFormResponse, UpdateGattFormRequest
} from '../../../core/models/valuation.model';

@Component({
  selector: 'app-valuation-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbAccordionModule, TranslateModule],
  template: `
    <div ngbAccordion [closeOthers]="false">
      <!-- Section A: Document Checklist -->
      <div ngbAccordionItem="checklist" [collapsed]="false">
        <h2 ngbAccordionHeader>
          <button ngbAccordionButton>
            <i class="bi bi-list-check me-2"></i>{{ 'VALUATION.CHECKLIST_TITLE' | translate }}
            @if (checklist()) {
              <span class="badge ms-2" [ngClass]="checklist()!.allPassed ? 'bg-success' : 'bg-warning text-dark'">
                {{ checklist()!.allPassed ? ('VALUATION.ALL_PASSED' | translate) : ('VALUATION.INCOMPLETE' | translate) }}
              </span>
            }
          </button>
        </h2>
        <div ngbAccordionCollapse>
          <div ngbAccordionBody>
            <ng-template>
              @if (checklist()) {
                <div class="list-group list-group-flush">
                  @for (item of checklist()!.items; track item.code) {
                    <div class="list-group-item d-flex align-items-center px-0">
                      <i class="bi me-2 fs-5" [ngClass]="item.passed ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'"></i>
                      <div>
                        <strong>{{ 'VALUATION.CHECKLIST_' + item.code | translate }}</strong>
                        <br><small class="text-muted">{{ item.detail }}</small>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center text-muted py-3">{{ 'COMMON.LOADING' | translate }}</div>
              }
            </ng-template>
          </div>
        </div>
      </div>

      <!-- Section B: External Permits -->
      <div ngbAccordionItem="permits">
        <h2 ngbAccordionHeader>
          <button ngbAccordionButton>
            <i class="bi bi-shield-check me-2"></i>{{ 'VALUATION.PERMITS_TITLE' | translate }}
            @if (hasBlockingPermits()) {
              <span class="badge bg-warning text-dark ms-2">{{ 'VALUATION.PERMITS_PENDING' | translate }}</span>
            }
          </button>
        </h2>
        <div ngbAccordionCollapse>
          <div ngbAccordionBody>
            <ng-template>
              @if (hasBlockingPermits()) {
                <div class="alert alert-warning py-2">
                  <i class="bi bi-exclamation-triangle me-1"></i>{{ 'VALUATION.PERMITS_BLOCKING_WARNING' | translate }}
                </div>
              }

              @if (permits().length > 0) {
                <div class="table-responsive">
                  <table class="table table-sm table-hover mb-3">
                    <thead class="table-light">
                      <tr>
                        <th>{{ 'VALUATION.PERMIT_TYPE' | translate }}</th>
                        <th>{{ 'COMMON.STATUS' | translate }}</th>
                        <th>{{ 'VALUATION.REFERENCE_NUMBER' | translate }}</th>
                        <th class="d-none d-md-table-cell">{{ 'VALUATION.ISSUED_DATE' | translate }}</th>
                        <th class="d-none d-md-table-cell">{{ 'VALUATION.EXPIRY_DATE' | translate }}</th>
                        @if (canEdit()) {
                          <th>{{ 'COMMON.ACTIONS' | translate }}</th>
                        }
                      </tr>
                    </thead>
                    <tbody>
                      @for (permit of permits(); track permit.id) {
                        <tr>
                          <td>{{ 'PERMIT_TYPES.' + permit.permitType | translate }}</td>
                          <td>
                            @if (canEdit() && editingPermitId() === permit.id) {
                              <select class="form-select form-select-sm" [(ngModel)]="editPermitStatus" style="width: auto;">
                                @for (s of permitStatuses; track s) {
                                  <option [value]="s">{{ 'PERMIT_STATUS.' + s | translate }}</option>
                                }
                              </select>
                            } @else {
                              <span class="badge" [ngClass]="getPermitStatusClass(permit.status)">{{ 'PERMIT_STATUS.' + permit.status | translate }}</span>
                            }
                          </td>
                          <td>
                            @if (canEdit() && editingPermitId() === permit.id) {
                              <input type="text" class="form-control form-control-sm" [(ngModel)]="editPermitRef" style="width: 140px;">
                            } @else {
                              {{ permit.referenceNumber ?? '-' }}
                            }
                          </td>
                          <td class="d-none d-md-table-cell">{{ permit.issuedDate ?? '-' }}</td>
                          <td class="d-none d-md-table-cell">{{ permit.expiryDate ?? '-' }}</td>
                          @if (canEdit()) {
                            <td>
                              @if (editingPermitId() === permit.id) {
                                <button class="btn btn-sm btn-success me-1" (click)="saveEditPermit(permit)"><i class="bi bi-check"></i></button>
                                <button class="btn btn-sm btn-secondary" (click)="cancelEditPermit()"><i class="bi bi-x"></i></button>
                              } @else {
                                <button class="btn btn-sm btn-outline-primary me-1" (click)="startEditPermit(permit)"><i class="bi bi-pencil"></i></button>
                                <button class="btn btn-sm btn-outline-danger" (click)="confirmDeletePermit(permit)"><i class="bi bi-trash"></i></button>
                              }
                            </td>
                          }
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <p class="text-muted">{{ 'VALUATION.NO_PERMITS' | translate }}</p>
              }

              @if (canEdit()) {
                @if (showPermitForm()) {
                  <div class="card border-primary mt-2">
                    <div class="card-body">
                      <h6>{{ 'VALUATION.ADD_PERMIT' | translate }}</h6>
                      <div class="row g-2">
                        <div class="col-md-3">
                          <label class="form-label">{{ 'VALUATION.PERMIT_TYPE' | translate }}</label>
                          <select class="form-select form-select-sm" [(ngModel)]="newPermitType">
                            @for (t of permitTypes; track t) {
                              <option [value]="t">{{ 'PERMIT_TYPES.' + t | translate }}</option>
                            }
                          </select>
                        </div>
                        <div class="col-md-3">
                          <label class="form-label">{{ 'COMMON.STATUS' | translate }}</label>
                          <select class="form-select form-select-sm" [(ngModel)]="newPermitStatus">
                            @for (s of permitStatuses; track s) {
                              <option [value]="s">{{ 'PERMIT_STATUS.' + s | translate }}</option>
                            }
                          </select>
                        </div>
                        <div class="col-md-3">
                          <label class="form-label">{{ 'VALUATION.REFERENCE_NUMBER' | translate }}</label>
                          <input type="text" class="form-control form-control-sm" [(ngModel)]="newPermitRef">
                        </div>
                        <div class="col-md-3">
                          <label class="form-label">{{ 'VALUATION.NOTES' | translate }}</label>
                          <input type="text" class="form-control form-control-sm" [(ngModel)]="newPermitNotes">
                        </div>
                      </div>
                      <div class="mt-2 d-flex gap-2">
                        <button class="btn btn-sm btn-primary" (click)="addPermit()" [disabled]="!newPermitType">{{ 'ACTIONS.SAVE' | translate }}</button>
                        <button class="btn btn-sm btn-secondary" (click)="showPermitForm.set(false)">{{ 'ACTIONS.CANCEL' | translate }}</button>
                      </div>
                    </div>
                  </div>
                } @else {
                  <button class="btn btn-sm btn-outline-primary" (click)="showPermitForm.set(true)">
                    <i class="bi bi-plus me-1"></i>{{ 'VALUATION.ADD_PERMIT' | translate }}
                  </button>
                }

                <!-- Local charges checkbox -->
                <div class="form-check mt-3">
                  <input type="checkbox" class="form-check-input" id="localChargesValidated"
                         [checked]="operation()?.localChargesValidated"
                         (change)="toggleLocalCharges($event)">
                  <label class="form-check-label" for="localChargesValidated">{{ 'VALUATION.LOCAL_CHARGES_VALIDATED' | translate }}</label>
                </div>
              }
            </ng-template>
          </div>
        </div>
      </div>

      <!-- Section C: GATT Article 1 Form -->
      @if (isGattRequired()) {
        <div ngbAccordionItem="gatt">
          <h2 ngbAccordionHeader>
            <button ngbAccordionButton>
              <i class="bi bi-calculator me-2"></i>{{ 'VALUATION.GATT_TITLE' | translate }}
              @if (gattForm()?.completedAt) {
                <span class="badge bg-success ms-2">{{ 'VALUATION.GATT_COMPLETED' | translate }}</span>
              } @else {
                <span class="badge bg-warning text-dark ms-2">{{ 'VALUATION.GATT_PENDING' | translate }}</span>
              }
            </button>
          </h2>
          <div ngbAccordionCollapse>
            <div ngbAccordionBody>
              <ng-template>
                @if (gattForm()) {
                  @if (gattForm()!.completedAt && !canEdit()) {
                    <!-- Read-only view when completed or not editable -->
                    <div class="alert alert-success py-2 mb-3">
                      <i class="bi bi-check-circle me-1"></i>
                      {{ 'VALUATION.GATT_COMPLETED_BY' | translate:{ user: gattForm()!.completedBy, date: (gattForm()!.completedAt | date:'medium') } }}
                    </div>
                  }

                  <form [formGroup]="gattFormGroup" (ngSubmit)="submitGattForm()">
                    <div class="row g-3">
                      <div class="col-md-6">
                        <div class="form-check mb-3">
                          <input type="checkbox" class="form-check-input" id="commercialLinks" formControlName="commercialLinks">
                          <label class="form-check-label" for="commercialLinks">{{ 'VALUATION.GATT_COMMERCIAL_LINKS' | translate }}</label>
                        </div>
                        <div class="mb-3">
                          <label class="form-label">{{ 'VALUATION.GATT_COMMISSIONS' | translate }}</label>
                          <div class="input-group input-group-sm">
                            <span class="input-group-text">$</span>
                            <input type="number" class="form-control" formControlName="commissions" step="0.01">
                          </div>
                        </div>
                        <div class="mb-3">
                          <label class="form-label">{{ 'VALUATION.GATT_UNRECORDED_TRANSPORT' | translate }}</label>
                          <div class="input-group input-group-sm">
                            <span class="input-group-text">$</span>
                            <input type="number" class="form-control" formControlName="unrecordedTransport" step="0.01">
                          </div>
                        </div>
                        <div class="mb-3">
                          <label class="form-label">{{ 'VALUATION.GATT_ADJUSTMENT' | translate }}</label>
                          <div class="input-group input-group-sm">
                            <span class="input-group-text">$</span>
                            <input type="number" class="form-control" formControlName="adjustmentAmount" step="0.01">
                          </div>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="mb-3">
                          <label class="form-label">{{ 'VALUATION.GATT_JUSTIFICATION' | translate }}</label>
                          <textarea class="form-control" formControlName="justification" rows="4"></textarea>
                        </div>
                        <div class="card bg-light">
                          <div class="card-body py-2">
                            <h6 class="mb-2">{{ 'VALUATION.GATT_CALCULATION' | translate }}</h6>
                            <dl class="row mb-0 small">
                              <dt class="col-7">{{ 'VALUATION.GATT_ORIGINAL_BASE' | translate }}</dt>
                              <dd class="col-5 text-end">{{ gattForm()!.originalTaxableBase | number:'1.2-2' }}</dd>
                              <dt class="col-7">{{ 'VALUATION.GATT_ADJUSTED_BASE' | translate }}</dt>
                              <dd class="col-5 text-end fw-bold">{{ calculatedAdjustedBase() | number:'1.2-2' }}</dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                    @if (canEdit()) {
                      <button type="submit" class="btn btn-primary btn-sm mt-2" [disabled]="gattFormGroup.invalid || savingGatt()">
                        @if (savingGatt()) {
                          <span class="spinner-border spinner-border-sm me-1"></span>
                        }
                        {{ 'ACTIONS.SAVE' | translate }}
                      </button>
                    }
                  </form>
                } @else {
                  <div class="text-center text-muted py-3">{{ 'COMMON.LOADING' | translate }}</div>
                }
              </ng-template>
            </div>
          </div>
        </div>
      }

      <!-- Section D: Finalize Valuation -->
      @if (canFinalize()) {
        <div ngbAccordionItem="finalize">
          <h2 ngbAccordionHeader>
            <button ngbAccordionButton>
              <i class="bi bi-check2-all me-2"></i>{{ 'VALUATION.FINALIZE_TITLE' | translate }}
            </button>
          </h2>
          <div ngbAccordionCollapse>
            <div ngbAccordionBody>
              <ng-template>
                @if (checklist()) {
                  <h6>{{ 'VALUATION.PREFLIGHT_SUMMARY' | translate }}</h6>
                  <div class="list-group list-group-flush mb-3">
                    @for (item of checklist()!.items; track item.code) {
                      <div class="list-group-item d-flex align-items-center py-1 px-0">
                        <i class="bi me-2" [ngClass]="item.passed ? 'bi-check-circle text-success' : 'bi-x-circle text-danger'"></i>
                        <span [class.text-muted]="item.passed">{{ 'VALUATION.CHECKLIST_' + item.code | translate }}</span>
                      </div>
                    }
                  </div>
                  <button class="btn btn-success" (click)="confirmFinalizeValuation()"
                          [disabled]="!checklist()!.allPassed || finalizing()">
                    @if (finalizing()) {
                      <span class="spinner-border spinner-border-sm me-1"></span>
                    }
                    <i class="bi bi-check2-all me-1"></i>{{ 'VALUATION.FINALIZE_BUTTON' | translate }}
                  </button>
                  @if (!checklist()!.allPassed) {
                    <p class="text-danger mt-2 mb-0"><small>{{ 'VALUATION.FINALIZE_BLOCKED' | translate }}</small></p>
                  }
                }
              </ng-template>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ValuationPanelComponent implements OnInit {
  operationId = input.required<number>();
  operation = input<Operation | null>(null);
  changed = output<void>();

  private valuationService = inject(ValuationService);
  private translate = inject(TranslateService);
  authService = inject(AuthService);

  // State signals
  checklist = signal<ValuationChecklist | null>(null);
  permits = signal<ExternalPermit[]>([]);
  gattForm = signal<GattFormResponse | null>(null);
  showPermitForm = signal(false);
  editingPermitId = signal<number | null>(null);
  savingGatt = signal(false);
  finalizing = signal(false);

  // Permit form fields
  newPermitType: ExternalPermitType | '' = '';
  newPermitStatus: ExternalPermitStatus = ExternalPermitStatus.PENDIENTE;
  newPermitRef = '';
  newPermitNotes = '';

  // Edit permit fields
  editPermitStatus = '';
  editPermitRef = '';

  // Enum arrays for template
  permitTypes = Object.values(ExternalPermitType);
  permitStatuses = Object.values(ExternalPermitStatus);

  // GATT reactive form
  gattFormGroup = new FormGroup({
    commercialLinks: new FormControl(false),
    commissions: new FormControl(0),
    unrecordedTransport: new FormControl(0),
    adjustmentAmount: new FormControl(0),
    justification: new FormControl('', Validators.required)
  });

  // Computed
  hasBlockingPermits = computed(() =>
    this.permits().some(p => p.status === ExternalPermitStatus.EN_TRAMITE)
  );

  isGattRequired = computed(() => {
    const op = this.operation();
    return op?.inspectionType === 'VISUAL' || op?.inspectionType === 'FISICA';
  });

  canEdit = computed(() => {
    const op = this.operation();
    if (!op) return false;
    return this.authService.hasRole(['ADMIN', 'AGENT']) &&
      (op.status === 'VALUATION_REVIEW' || op.status === 'PENDING_EXTERNAL_APPROVAL');
  });

  canFinalize = computed(() => {
    const op = this.operation();
    if (!op) return false;
    return this.authService.hasRole(['ADMIN', 'AGENT']) && op.status === 'VALUATION_REVIEW';
  });

  calculatedAdjustedBase = computed(() => {
    const gatt = this.gattForm();
    if (!gatt) return 0;
    const base = gatt.originalTaxableBase ?? 0;
    const c = this.gattFormGroup.get('commissions')?.value ?? 0;
    const t = this.gattFormGroup.get('unrecordedTransport')?.value ?? 0;
    const a = this.gattFormGroup.get('adjustmentAmount')?.value ?? 0;
    return base + c + t + a;
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    const id = this.operationId();
    this.valuationService.getChecklist(id).subscribe(c => this.checklist.set(c));
    this.valuationService.getPermits(id).subscribe(p => this.permits.set(p));
    if (this.isGattRequired()) {
      this.valuationService.getGattForm(id).subscribe(g => {
        this.gattForm.set(g);
        if (g.commissions != null) {
          this.gattFormGroup.patchValue({
            commercialLinks: g.commercialLinks ?? false,
            commissions: g.commissions ?? 0,
            unrecordedTransport: g.unrecordedTransport ?? 0,
            adjustmentAmount: g.adjustmentAmount ?? 0,
            justification: g.justification ?? ''
          });
        }
        if (!this.canEdit() || g.completedAt) {
          this.gattFormGroup.disable();
        }
      });
    }
  }

  // ── Permits ──

  addPermit(): void {
    if (!this.newPermitType) return;
    const request: ExternalPermitRequest = {
      permitType: this.newPermitType as ExternalPermitType,
      status: this.newPermitStatus,
      referenceNumber: this.newPermitRef || undefined,
      notes: this.newPermitNotes || undefined
    };
    this.valuationService.createPermit(this.operationId(), request).subscribe(() => {
      this.resetPermitForm();
      this.showPermitForm.set(false);
      this.loadData();
      this.changed.emit();
    });
  }

  startEditPermit(permit: ExternalPermit): void {
    this.editingPermitId.set(permit.id);
    this.editPermitStatus = permit.status;
    this.editPermitRef = permit.referenceNumber ?? '';
  }

  saveEditPermit(permit: ExternalPermit): void {
    const request: ExternalPermitRequest = {
      permitType: permit.permitType,
      status: this.editPermitStatus as ExternalPermitStatus,
      referenceNumber: this.editPermitRef || undefined,
      issuedDate: permit.issuedDate || undefined,
      expiryDate: permit.expiryDate || undefined,
      notes: permit.notes || undefined
    };
    this.valuationService.updatePermit(this.operationId(), permit.id, request).subscribe(() => {
      this.cancelEditPermit();
      this.loadData();
      this.changed.emit();
    });
  }

  cancelEditPermit(): void {
    this.editingPermitId.set(null);
  }

  confirmDeletePermit(permit: ExternalPermit): void {
    const msg = this.translate.instant('COMMON.ARE_YOU_SURE');
    if (confirm(msg)) {
      this.valuationService.deletePermit(this.operationId(), permit.id).subscribe(() => {
        this.loadData();
        this.changed.emit();
      });
    }
  }

  toggleLocalCharges(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.valuationService.toggleLocalChargesValidated(this.operationId(), checked).subscribe(() => {
      this.loadData();
      this.changed.emit();
    });
  }

  // ── GATT ──

  submitGattForm(): void {
    if (this.gattFormGroup.invalid) return;
    this.savingGatt.set(true);
    const request: UpdateGattFormRequest = {
      commercialLinks: this.gattFormGroup.value.commercialLinks ?? false,
      commissions: this.gattFormGroup.value.commissions ?? 0,
      unrecordedTransport: this.gattFormGroup.value.unrecordedTransport ?? 0,
      adjustmentAmount: this.gattFormGroup.value.adjustmentAmount ?? 0,
      justification: this.gattFormGroup.value.justification ?? ''
    };
    this.valuationService.saveGattForm(this.operationId(), request).subscribe({
      next: (g) => {
        this.gattForm.set(g);
        this.savingGatt.set(false);
        this.gattFormGroup.disable();
        this.loadData();
        this.changed.emit();
      },
      error: () => this.savingGatt.set(false)
    });
  }

  // ── Finalize ──

  confirmFinalizeValuation(): void {
    const msg = this.translate.instant('COMMON.ARE_YOU_SURE');
    if (!confirm(msg)) return;
    this.finalizing.set(true);
    this.valuationService.finalizeValuation(this.operationId()).subscribe({
      next: () => {
        this.finalizing.set(false);
        this.changed.emit();
      },
      error: () => this.finalizing.set(false)
    });
  }

  // ── Helpers ──

  getPermitStatusClass(status: ExternalPermitStatus): string {
    switch (status) {
      case ExternalPermitStatus.PENDIENTE: return 'bg-secondary';
      case ExternalPermitStatus.EN_TRAMITE: return 'bg-warning text-dark';
      case ExternalPermitStatus.APROBADO: return 'bg-success';
      case ExternalPermitStatus.RECHAZADO: return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  private resetPermitForm(): void {
    this.newPermitType = '';
    this.newPermitStatus = ExternalPermitStatus.PENDIENTE;
    this.newPermitRef = '';
    this.newPermitNotes = '';
  }
}
