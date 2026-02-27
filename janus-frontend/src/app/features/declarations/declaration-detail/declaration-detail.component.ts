import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { DeclarationService } from '../../../core/services/declaration.service';
import { OperationService } from '../../../core/services/operation.service';
import { Declaration, DeclarationType, TariffLine } from '../../../core/models/declaration.model';
import { AuthService } from '../../../core/services/auth.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { TariffLineFormComponent } from '../tariff-line-form/tariff-line-form.component';

@Component({
  selector: 'app-declaration-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, TranslateModule, StatusBadgeComponent],
  template: `
    @if (declaration()) {
      <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
        <h3>{{ 'DECLARATIONS.DETAIL_TITLE' | translate }}: {{ declaration()!.declarationNumber }}</h3>
        <a [routerLink]="['/operations', declaration()!.operationId]" class="btn btn-outline-secondary btn-sm">{{ 'ACTIONS.CLOSE' | translate }}</a>
      </div>
      <div class="card mb-3">
        <div class="card-body">
          @if (!editing()) {
            <div class="row">
              <div class="col-md-4">
                <dl>
                  <dt>{{ 'DECLARATIONS.TYPE' | translate }}</dt><dd><app-status-badge [status]="declaration()!.declarationType" /></dd>
                  <dt>{{ 'DECLARATIONS.FOB_VALUE' | translate }}</dt><dd>{{ declaration()!.fobValue | number:'1.2-2' }}</dd>
                  <dt>{{ 'DECLARATIONS.CIF_VALUE' | translate }}</dt><dd>{{ declaration()!.cifValue | number:'1.2-2' }}</dd>
                </dl>
              </div>
              <div class="col-md-4">
                <dl>
                  <dt>{{ 'DECLARATIONS.TAXABLE_BASE' | translate }}</dt><dd>{{ declaration()!.taxableBase | number:'1.2-2' }}</dd>
                  <dt>{{ 'DECLARATIONS.TOTAL_TAXES' | translate }}</dt><dd>{{ declaration()!.totalTaxes | number:'1.2-2' }}</dd>
                  <dt>{{ 'DECLARATIONS.GATT_METHOD' | translate }}</dt><dd>{{ declaration()!.gattMethod }}</dd>
                </dl>
              </div>
              <div class="col-md-4">
                <dl>
                  <dt>{{ 'DECLARATIONS.FREIGHT_VALUE' | translate }}</dt><dd>{{ declaration()!.freightValue | number:'1.2-2' }}</dd>
                  <dt>{{ 'DECLARATIONS.INSURANCE_VALUE' | translate }}</dt><dd>{{ declaration()!.insuranceValue | number:'1.2-2' }}</dd>
                </dl>
              </div>
            </div>
            @if (declaration()!.notes) { <p><strong>{{ 'DECLARATIONS.NOTES' | translate }}:</strong> {{ declaration()!.notes }}</p> }
            @if (authService.hasRole(['ADMIN', 'AGENT']) && canEdit()) {
              <button class="btn btn-sm btn-outline-primary mt-2" (click)="startEditing()">{{ 'ACTIONS.EDIT' | translate }}</button>
            }
          } @else {
            <form [formGroup]="form">
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">{{ 'DECLARATIONS.DECLARATION_NUMBER' | translate }}</label>
                  <input type="text" class="form-control" formControlName="declarationNumber">
                </div>
                <div class="col-md-6">
                  <label class="form-label">{{ 'DECLARATIONS.GATT_METHOD' | translate }}</label>
                  <input type="text" class="form-control" formControlName="gattMethod">
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-4">
                  <label class="form-label">{{ 'DECLARATIONS.FOB_VALUE' | translate }}</label>
                  <input type="number" class="form-control" formControlName="fobValue" step="0.01">
                </div>
                <div class="col-md-4">
                  <label class="form-label">{{ 'DECLARATIONS.FREIGHT_VALUE' | translate }}</label>
                  <input type="number" class="form-control" formControlName="freightValue" step="0.01">
                </div>
                <div class="col-md-4">
                  <label class="form-label">{{ 'DECLARATIONS.INSURANCE_VALUE' | translate }}</label>
                  <input type="number" class="form-control" formControlName="insuranceValue" step="0.01">
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-4">
                  <label class="form-label">{{ 'DECLARATIONS.CIF_VALUE' | translate }}</label>
                  <input type="number" class="form-control" formControlName="cifValue" step="0.01">
                </div>
                <div class="col-md-4">
                  <label class="form-label">{{ 'DECLARATIONS.TAXABLE_BASE' | translate }}</label>
                  <input type="number" class="form-control" formControlName="taxableBase" step="0.01">
                </div>
                <div class="col-md-4">
                  <label class="form-label">{{ 'DECLARATIONS.TOTAL_TAXES' | translate }}</label>
                  <input type="number" class="form-control" formControlName="totalTaxes" step="0.01">
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">{{ 'DECLARATIONS.NOTES' | translate }}</label>
                <textarea class="form-control" formControlName="notes" rows="2"></textarea>
              </div>
            </form>
            <div class="mt-2 d-flex gap-2">
              <button class="btn btn-sm btn-primary" (click)="saveEdit()" [disabled]="form.invalid">{{ 'ACTIONS.SAVE' | translate }}</button>
              <button class="btn btn-sm btn-outline-secondary" (click)="editing.set(false)">{{ 'ACTIONS.CANCEL' | translate }}</button>
            </div>
          }
        </div>
      </div>

      <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-2">
        <h5>{{ 'DECLARATIONS.TARIFF_LINES' | translate }}</h5>
        @if (authService.hasRole(['ADMIN', 'AGENT']) && canEdit()) {
          <button class="btn btn-sm btn-outline-primary" (click)="openTariffLineForm()">{{ 'DECLARATIONS.ADD_TARIFF_LINE' | translate }}</button>
        }
      </div>
      @if (tariffLines().length > 0) {
        <div class="table-responsive">
          <table class="table table-sm">
            <thead class="table-light">
              <tr>
                <th>{{ 'DECLARATIONS.LINE_NUMBER' | translate }}</th>
                <th>{{ 'DECLARATIONS.TARIFF_CODE' | translate }}</th>
                <th>{{ 'DECLARATIONS.DESCRIPTION' | translate }}</th>
                <th>{{ 'DECLARATIONS.QUANTITY' | translate }}</th>
                <th>{{ 'DECLARATIONS.UNIT_VALUE' | translate }}</th>
                <th>{{ 'DECLARATIONS.TOTAL_VALUE' | translate }}</th>
                <th>{{ 'DECLARATIONS.TAX_RATE' | translate }}</th>
                <th>{{ 'DECLARATIONS.TAX_AMOUNT' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (line of tariffLines(); track line.id) {
                <tr>
                  <td>{{ line.lineNumber }}</td>
                  <td>{{ line.tariffCode }}</td>
                  <td>{{ line.description }}</td>
                  <td>{{ line.quantity | number:'1.2-2' }}</td>
                  <td>{{ line.unitValue | number:'1.2-2' }}</td>
                  <td>{{ line.totalValue | number:'1.2-2' }}</td>
                  <td>{{ line.taxRate | number:'1.2-2' }}%</td>
                  <td>{{ line.taxAmount | number:'1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <p class="text-muted">{{ 'DECLARATIONS.NO_TARIFF_LINES' | translate }}</p>
      }
    }
  `
})
export class DeclarationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private declarationService = inject(DeclarationService);
  private operationService = inject(OperationService);
  private modal = inject(NgbModal);
  authService = inject(AuthService);

  declaration = signal<Declaration | null>(null);
  tariffLines = signal<TariffLine[]>([]);
  editing = signal(false);
  operationStatus = signal<string>('');

  private static readonly PRELIMINARY_EDITABLE_STATUSES = [
    'DRAFT', 'DOCUMENTATION_COMPLETE', 'IN_REVIEW', 'PENDING_CORRECTION'
  ];

  private static readonly FINAL_EDITABLE_STATUSES = [
    'DECLARATION_IN_PROGRESS', 'SUBMITTED_TO_CUSTOMS'
  ];

  canEdit = computed(() => {
    const decl = this.declaration();
    if (!decl) return true;
    if (decl.declarationType === DeclarationType.PRELIMINARY) {
      return DeclarationDetailComponent.PRELIMINARY_EDITABLE_STATUSES.includes(this.operationStatus());
    }
    if (decl.declarationType === DeclarationType.FINAL) {
      return DeclarationDetailComponent.FINAL_EDITABLE_STATUSES.includes(this.operationStatus());
    }
    return true;
  });

  form = new FormGroup({
    declarationNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fobValue: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
    cifValue: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
    taxableBase: new FormControl({ value: 0, disabled: true }, { nonNullable: true, validators: [Validators.required] }),
    totalTaxes: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
    freightValue: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
    insuranceValue: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
    gattMethod: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    notes: new FormControl('', { nonNullable: true })
  });

  constructor() {
    this.form.get('cifValue')!.valueChanges.subscribe(cif => {
      this.form.get('taxableBase')!.setValue(cif, { emitEvent: false });
    });
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    const opId = +this.route.snapshot.paramMap.get('operationId')!;
    const declId = +this.route.snapshot.paramMap.get('declarationId')!;
    this.declarationService.getDeclaration(opId, declId).subscribe(d => this.declaration.set(d));
    this.declarationService.getTariffLines(opId, declId).subscribe(lines => this.tariffLines.set(lines));
    this.operationService.getById(opId).subscribe(op => this.operationStatus.set(op.status));
  }

  startEditing(): void {
    const d = this.declaration()!;
    this.form.patchValue({
      declarationNumber: d.declarationNumber ?? '',
      fobValue: d.fobValue ?? 0,
      cifValue: d.cifValue ?? 0,
      totalTaxes: d.totalTaxes ?? 0,
      freightValue: d.freightValue ?? 0,
      insuranceValue: d.insuranceValue ?? 0,
      gattMethod: d.gattMethod ?? '',
      notes: d.notes ?? ''
    });
    this.form.get('taxableBase')!.setValue(d.cifValue ?? 0, { emitEvent: false });
    this.editing.set(true);
  }

  saveEdit(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    const d = this.declaration()!;
    this.declarationService.updateDeclaration(d.operationId, d.id, { ...val, notes: val.notes || undefined })
      .subscribe(() => {
        this.editing.set(false);
        this.load();
      });
  }

  openTariffLineForm(): void {
    const ref = this.modal.open(TariffLineFormComponent);
    ref.componentInstance.operationId = this.declaration()!.operationId;
    ref.componentInstance.declarationId = this.declaration()!.id;
    ref.result.then(() => this.load(), () => {});
  }
}
