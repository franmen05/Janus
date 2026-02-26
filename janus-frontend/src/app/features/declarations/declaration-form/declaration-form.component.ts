import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { DeclarationService } from '../../../core/services/declaration.service';

@Component({
  selector: 'app-declaration-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ (declarationType === 'PRELIMINARY' ? 'DECLARATIONS.REGISTER_PRELIMINARY' : 'DECLARATIONS.REGISTER_FINAL') | translate }}</h5>
      <button type="button" class="btn-close" (click)="activeModal.dismiss()"></button>
    </div>
    <div class="modal-body">
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
            <label class="form-label">{{ 'DECLARATIONS.INSURANCE_VALUE' | translate }} <small class="text-muted">(2% FOB)</small></label>
            <input type="number" class="form-control" formControlName="insuranceValue" step="0.01" readonly>
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
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-outline-secondary" (click)="activeModal.dismiss()">{{ 'ACTIONS.CANCEL' | translate }}</button>
      <button type="button" class="btn btn-primary" (click)="onSubmit()" [disabled]="form.invalid">{{ 'ACTIONS.SAVE' | translate }}</button>
    </div>
  `
})
export class DeclarationFormComponent {
  activeModal = inject(NgbActiveModal);
  private declarationService = inject(DeclarationService);

  operationId!: number;
  declarationType!: string;

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
    this.form.get('fobValue')!.valueChanges.subscribe(fob => {
      const insurance = Math.round(fob * 0.02 * 100) / 100;
      this.form.get('insuranceValue')!.setValue(insurance, { emitEvent: false });
      this.recalculateCif();
    });
    this.form.get('freightValue')!.valueChanges.subscribe(() => this.recalculateCif());
    this.form.get('cifValue')!.valueChanges.subscribe(cif => {
      this.form.get('taxableBase')!.setValue(cif, { emitEvent: false });
    });
  }

  private recalculateCif(): void {
    const fob = this.form.get('fobValue')!.value || 0;
    const freight = this.form.get('freightValue')!.value || 0;
    const insurance = this.form.get('insuranceValue')!.value || 0;
    const cif = Math.round((fob + freight + insurance) * 100) / 100;
    this.form.get('cifValue')!.setValue(cif);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    const request = { ...val, notes: val.notes || undefined };
    const obs = this.declarationType === 'PRELIMINARY'
      ? this.declarationService.createPreliminary(this.operationId, request)
      : this.declarationService.createFinal(this.operationId, request);
    obs.subscribe(() => this.activeModal.close());
  }
}
