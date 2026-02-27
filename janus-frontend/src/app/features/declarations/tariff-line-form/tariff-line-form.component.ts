import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { DeclarationService } from '../../../core/services/declaration.service';

@Component({
  selector: 'app-tariff-line-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ 'DECLARATIONS.ADD_TARIFF_LINE' | translate }}</h5>
      <button type="button" class="btn-close" (click)="activeModal.dismiss()"></button>
    </div>
    <div class="modal-body">
      <form [formGroup]="form">
        <div class="row mb-3">
          <div class="col-md-4">
            <label class="form-label">{{ 'DECLARATIONS.LINE_NUMBER' | translate }} <span class="text-danger">*</span></label>
            <input type="number" class="form-control" formControlName="lineNumber">
          </div>
          <div class="col-md-4">
            <label class="form-label">{{ 'DECLARATIONS.TARIFF_CODE' | translate }} <span class="text-danger">*</span></label>
            <input type="text" class="form-control" formControlName="tariffCode">
          </div>
          <div class="col-md-4">
            <label class="form-label">{{ 'DECLARATIONS.DESCRIPTION' | translate }}</label>
            <input type="text" class="form-control" formControlName="description">
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-md-3">
            <label class="form-label">{{ 'DECLARATIONS.QUANTITY' | translate }} <span class="text-danger">*</span></label>
            <input type="number" class="form-control" formControlName="quantity" step="0.01">
          </div>
          <div class="col-md-3">
            <label class="form-label">{{ 'DECLARATIONS.UNIT_VALUE' | translate }} <span class="text-danger">*</span></label>
            <input type="number" class="form-control" formControlName="unitValue" step="0.01">
          </div>
          <div class="col-md-3">
            <label class="form-label">{{ 'DECLARATIONS.TOTAL_VALUE' | translate }} <span class="text-danger">*</span></label>
            <input type="number" class="form-control" formControlName="totalValue" step="0.01">
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-md-3">
            <label class="form-label">{{ 'DECLARATIONS.TAX_RATE' | translate }} <span class="text-danger">*</span></label>
            <input type="number" class="form-control" formControlName="taxRate" step="0.01">
          </div>
          <div class="col-md-3">
            <label class="form-label">{{ 'DECLARATIONS.TAX_AMOUNT' | translate }} <span class="text-danger">*</span></label>
            <input type="number" class="form-control" formControlName="taxAmount" step="0.01">
          </div>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-outline-secondary" (click)="activeModal.dismiss()">{{ 'ACTIONS.CANCEL' | translate }}</button>
      <button type="button" class="btn btn-primary" (click)="onSubmit()" [disabled]="form.invalid">{{ 'ACTIONS.ADD' | translate }}</button>
    </div>
  `
})
export class TariffLineFormComponent {
  activeModal = inject(NgbActiveModal);
  private declarationService = inject(DeclarationService);

  operationId!: number;
  declarationId!: number;

  form = new FormGroup({
    lineNumber: new FormControl(1, { nonNullable: true, validators: [Validators.required] }),
    tariffCode: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    quantity: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
    unitValue: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
    totalValue: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
    taxRate: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
    taxAmount: new FormControl(0, { nonNullable: true, validators: [Validators.required] })
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    const request = { ...val, description: val.description || undefined };
    this.declarationService.addTariffLine(this.operationId, this.declarationId, request).subscribe(() => this.activeModal.close());
  }
}
