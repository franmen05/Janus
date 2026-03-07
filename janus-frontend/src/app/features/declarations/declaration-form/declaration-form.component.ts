import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DeclarationService } from '../../../core/services/declaration.service';

@Component({
  selector: 'app-declaration-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, RouterModule],
  template: `
    <h2 class="mb-4">{{ title() | translate }}</h2>
    <div class="card">
      <div class="card-body">
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
            <div class="col-6 col-md-4">
              <label class="form-label">{{ 'DECLARATIONS.FOB_VALUE' | translate }}</label>
              <input type="number" class="form-control" formControlName="fobValue" step="0.01"
                     [class.is-invalid]="form.get('fobValue')!.invalid && form.get('fobValue')!.touched">
              @if (form.get('fobValue')!.hasError('min') && form.get('fobValue')!.touched) {
                <div class="invalid-feedback">{{ 'DECLARATIONS.FOB_VALUE_MIN' | translate }}</div>
              }
            </div>
            <div class="col-6 col-md-4">
              <label class="form-label">{{ 'DECLARATIONS.FREIGHT_VALUE' | translate }}</label>
              <input type="number" class="form-control" formControlName="freightValue" step="0.01">
            </div>
            <div class="col-6 col-md-4">
              <label class="form-label">{{ 'DECLARATIONS.INSURANCE_VALUE' | translate }} <small class="text-muted">(2% FOB)</small></label>
              <input type="number" class="form-control" formControlName="insuranceValue" step="0.01" readonly>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-6 col-md-4">
              <label class="form-label">{{ 'DECLARATIONS.CIF_VALUE' | translate }}</label>
              <input type="number" class="form-control" formControlName="cifValue" step="0.01">
            </div>
            <div class="col-6 col-md-4">
              <label class="form-label">{{ 'DECLARATIONS.TAXABLE_BASE' | translate }}</label>
              <input type="number" class="form-control" formControlName="taxableBase" step="0.01">
            </div>
            <div class="col-6 col-md-4">
              <label class="form-label">{{ 'DECLARATIONS.TOTAL_TAXES' | translate }}</label>
              <input type="number" class="form-control" formControlName="totalTaxes" step="0.01">
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">{{ 'DECLARATIONS.NOTES' | translate }}</label>
            <textarea class="form-control" formControlName="notes" rows="2"></textarea>
          </div>
          <div class="d-flex gap-2 justify-content-end">
            <a class="btn btn-outline-secondary" [routerLink]="cancelRoute()">{{ 'ACTIONS.CANCEL' | translate }}</a>
            <button type="button" class="btn btn-primary" (click)="onSubmit()" [disabled]="form.invalid">{{ 'ACTIONS.SAVE' | translate }}</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class DeclarationFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private declarationService = inject(DeclarationService);

  isEdit = signal(false);
  private operationId = 0;
  private declarationId = 0;
  private declarationType = '';

  title = signal('DECLARATIONS.REGISTER_PRELIMINARY');
  cancelRoute = signal<string[]>([]);

  form = new FormGroup({
    declarationNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fobValue: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0.01)] }),
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

  ngOnInit(): void {
    this.operationId = +this.route.snapshot.paramMap.get('operationId')!;
    const declIdParam = this.route.snapshot.paramMap.get('declarationId');

    if (declIdParam) {
      this.isEdit.set(true);
      this.declarationId = +declIdParam;
      this.title.set('DECLARATIONS.EDIT_TITLE');
      this.cancelRoute.set(['/operations', String(this.operationId), 'declarations', String(this.declarationId)]);
      this.declarationService.getDeclaration(this.operationId, this.declarationId).subscribe(d => {
        this.declarationType = d.declarationType;
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
      });
    } else {
      this.declarationType = this.route.snapshot.queryParamMap.get('type') || 'PRELIMINARY';
      this.title.set(this.declarationType === 'PRELIMINARY' ? 'DECLARATIONS.REGISTER_PRELIMINARY' : 'DECLARATIONS.REGISTER_FINAL');
      this.cancelRoute.set(['/operations', String(this.operationId)]);
    }
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

    if (this.isEdit()) {
      this.declarationService.updateDeclaration(this.operationId, this.declarationId, request)
        .subscribe(d => {
          this.router.navigate(['/operations', this.operationId, 'declarations', this.declarationId]);
        });
    } else {
      const obs = this.declarationType === 'PRELIMINARY'
        ? this.declarationService.createPreliminary(this.operationId, request)
        : this.declarationService.createFinal(this.operationId, request);
      obs.subscribe(d => {
        this.router.navigate(['/operations', this.operationId, 'declarations', d.id]);
      });
    }
  }
}
