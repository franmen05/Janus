import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { DeclarationService } from '../../../core/services/declaration.service';
import { ExchangeRateService } from '../../../core/services/exchange-rate.service';
import { OperationService } from '../../../core/services/operation.service';
import { ExchangeRate } from '../../../core/models/exchange-rate.model';

@Component({
  selector: 'app-declaration-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, RouterModule, CommonModule],
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
          </div>

          <!-- Exchange Rate Info Bar -->
          @if (currentRate || form.get('exchangeRate')!.value) {
            <div class="alert alert-info d-flex align-items-center justify-content-between mb-3">
              <div>
                <strong>{{ 'DECLARATIONS.EXCHANGE_RATE' | translate }}:</strong>
                1 USD = {{ form.get('exchangeRate')!.value | number:'1.4-4' }} DOP
                @if (currentRate?.effectiveDate) {
                  <span class="text-muted ms-2">({{ currentRate!.effectiveDate }})</span>
                }
                @if (isManualRate) {
                  <span class="badge bg-warning ms-2">Manual</span>
                }
              </div>
              <div class="d-flex align-items-center gap-2">
                <div class="input-group input-group-sm" style="width: 160px;">
                  <input type="number" class="form-control form-control-sm" formControlName="exchangeRate" step="0.0001">
                </div>
                @if (isManualRate && currentRate) {
                  <button type="button" class="btn btn-outline-secondary btn-sm" (click)="resetRate()">
                    {{ 'DECLARATIONS.EXCHANGE_RATE_RESET' | translate }}
                  </button>
                }
              </div>
            </div>
          }
          @if (rateLoading) {
            <div class="alert alert-secondary mb-3">
              <span class="spinner-border spinner-border-sm me-2"></span>{{ 'COMMON.LOADING' | translate }}
            </div>
          }
          @if (rateError) {
            <div class="alert alert-warning mb-3">
              {{ rateError | translate }}
            </div>
          }

          <!-- USD Values Section -->
          <h6 class="text-muted mb-2">{{ 'DECLARATIONS.USD_VALUES' | translate }}</h6>
          <div class="row mb-3">
            <div class="col-6 col-md-3">
              <label class="form-label">{{ 'DECLARATIONS.FOB_VALUE_USD' | translate }} <span class="text-danger">*</span></label>
              <input type="number" class="form-control" formControlName="fobValue" step="0.01"
                     [class.is-invalid]="form.get('fobValue')!.invalid && form.get('fobValue')!.touched">
              @if (form.get('fobValue')!.hasError('min') && form.get('fobValue')!.touched) {
                <div class="invalid-feedback">{{ 'DECLARATIONS.FOB_VALUE_MIN' | translate }}</div>
              }
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label">{{ 'DECLARATIONS.FREIGHT_VALUE_USD' | translate }} <span class="text-danger">*</span></label>
              <input type="number" class="form-control" formControlName="freightValue" step="0.01">
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label">{{ 'DECLARATIONS.INSURANCE_PERCENTAGE' | translate }}</label>
              <div class="input-group">
                <input type="number" class="form-control" formControlName="insurancePercentage" step="0.01" min="0">
                <span class="input-group-text">%</span>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label">{{ 'DECLARATIONS.INSURANCE_VALUE_USD' | translate }} <span class="text-danger">*</span></label>
              <input type="number" class="form-control" formControlName="insuranceValue" step="0.01">
            </div>
          </div>

          <!-- DOP Converted Values (read-only preview) -->
          @if (form.get('exchangeRate')!.value) {
            <h6 class="text-muted mb-2">{{ 'DECLARATIONS.DOP_VALUES' | translate }}</h6>
            <div class="row mb-3">
              <div class="col-6 col-md-3">
                <label class="form-label">{{ 'DECLARATIONS.FOB_VALUE' | translate }} (DOP)</label>
                <input type="text" class="form-control" [value]="fobDop() | number:'1.2-2'" readonly>
              </div>
              <div class="col-6 col-md-3">
                <label class="form-label">{{ 'DECLARATIONS.FREIGHT_VALUE' | translate }} (DOP)</label>
                <input type="text" class="form-control" [value]="freightDop() | number:'1.2-2'" readonly>
              </div>
              <div class="col-6 col-md-3">
                <label class="form-label">{{ 'DECLARATIONS.INSURANCE_VALUE' | translate }} (DOP)</label>
                <input type="text" class="form-control" [value]="insuranceDop() | number:'1.2-2'" readonly>
              </div>
              <div class="col-6 col-md-3">
                <label class="form-label">{{ 'DECLARATIONS.CIF_VALUE' | translate }} (DOP)</label>
                <input type="text" class="form-control bg-light fw-bold" [value]="cifDop() | number:'1.2-2'" readonly>
              </div>
            </div>
          }

          <div class="row mb-3">
            <div class="col-6 col-md-4">
              <label class="form-label">{{ 'DECLARATIONS.CIF_VALUE_USD' | translate }} <span class="text-danger">*</span></label>
              <input type="number" class="form-control" formControlName="cifValue" step="0.01">
            </div>
            <div class="col-6 col-md-4">
              <label class="form-label">{{ 'DECLARATIONS.TAXABLE_BASE' | translate }} <span class="text-danger">*</span></label>
              <input type="number" class="form-control" formControlName="taxableBase" step="0.01">
            </div>
            <div class="col-6 col-md-4">
              <label class="form-label">{{ 'DECLARATIONS.TOTAL_TAXES' | translate }} <span class="text-danger">*</span></label>
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
  private exchangeRateService = inject(ExchangeRateService);
  private operationService = inject(OperationService);

  isEdit = signal(false);
  private operationId = 0;
  private declarationId = 0;
  private declarationType = '';
  private manualInsurance = false;

  title = signal('DECLARATIONS.REGISTER_PRELIMINARY');
  cancelRoute = signal<string[]>([]);

  currentRate: ExchangeRate | null = null;
  rateLoading = false;
  rateError: string | null = null;
  isManualRate = false;

  fobDop = signal(0);
  freightDop = signal(0);
  insuranceDop = signal(0);
  cifDop = signal(0);

  form = new FormGroup({
    declarationNumber: new FormControl('', { nonNullable: true }),
    fobValue: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0.01)] }),
    cifValue: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
    taxableBase: new FormControl({ value: 0, disabled: true }, { nonNullable: true, validators: [Validators.required] }),
    totalTaxes: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
    freightValue: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
    insurancePercentage: new FormControl(2, { nonNullable: true }),
    insuranceValue: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
    notes: new FormControl('', { nonNullable: true }),
    exchangeRate: new FormControl<number | null>(null, { nonNullable: false })
  });

  constructor() {
    this.form.get('fobValue')!.valueChanges.subscribe(fob => {
      if (!this.manualInsurance) {
        this.recalculateInsurance();
      } else {
        const ins = this.form.get('insuranceValue')!.value || 0;
        if (fob > 0) {
          const pct = Math.round(ins / fob * 100 * 100) / 100;
          this.form.get('insurancePercentage')!.setValue(pct, { emitEvent: false });
        }
        this.recalculateCif();
      }
      this.recalculateDop();
    });
    this.form.get('insurancePercentage')!.valueChanges.subscribe(() => {
      this.manualInsurance = false;
      this.recalculateInsurance();
    });
    this.form.get('insuranceValue')!.valueChanges.subscribe(ins => {
      this.manualInsurance = true;
      const fob = this.form.get('fobValue')!.value || 0;
      if (fob > 0) {
        const pct = Math.round(ins / fob * 100 * 100) / 100;
        this.form.get('insurancePercentage')!.setValue(pct, { emitEvent: false });
      }
      this.recalculateCif();
      this.recalculateDop();
    });
    this.form.get('freightValue')!.valueChanges.subscribe(() => {
      this.recalculateCif();
      this.recalculateDop();
    });
    this.form.get('cifValue')!.valueChanges.subscribe(cif => {
      this.form.get('taxableBase')!.setValue(cif, { emitEvent: false });
    });
    this.form.get('exchangeRate')!.valueChanges.subscribe(rate => {
      if (this.currentRate && rate !== this.currentRate.rate) {
        this.isManualRate = true;
      }
      this.recalculateDop();
    });
  }

  private recalculateInsurance(): void {
    const fob = this.form.get('fobValue')!.value || 0;
    const pct = this.form.get('insurancePercentage')!.value || 0;
    const insurance = Math.round(fob * pct / 100 * 100) / 100;
    this.form.get('insuranceValue')!.setValue(insurance, { emitEvent: false });
    this.recalculateCif();
    this.recalculateDop();
  }

  private recalculateDop(): void {
    const rate = this.form.get('exchangeRate')!.value || 0;
    const fob = this.form.get('fobValue')!.value || 0;
    const freight = this.form.get('freightValue')!.value || 0;
    const insurance = this.form.get('insuranceValue')!.value || 0;
    this.fobDop.set(Math.round(fob * rate * 100) / 100);
    this.freightDop.set(Math.round(freight * rate * 100) / 100);
    this.insuranceDop.set(Math.round(insurance * rate * 100) / 100);
    this.cifDop.set(Math.round((fob + freight + insurance) * rate * 100) / 100);
  }

  ngOnInit(): void {
    this.operationId = +this.route.snapshot.paramMap.get('operationId')!;
    const declIdParam = this.route.snapshot.paramMap.get('declarationId');

    // Fetch exchange rate based on operation's ETA
    this.loadExchangeRate();

    if (declIdParam) {
      this.isEdit.set(true);
      this.declarationId = +declIdParam;
      this.title.set('DECLARATIONS.EDIT_TITLE');
      this.cancelRoute.set(['/operations', String(this.operationId), 'declarations', String(this.declarationId)]);
      this.declarationService.getDeclaration(this.operationId, this.declarationId).subscribe(d => {
        this.declarationType = d.declarationType;
        this.manualInsurance = true;

        // If declaration has USD values, populate USD fields; otherwise fall back to DOP values
        const fobUsd = d.fobValueUsd ?? d.fobValue ?? 0;
        const freightUsd = d.freightValueUsd ?? d.freightValue ?? 0;
        const insuranceUsd = d.insuranceValueUsd ?? d.insuranceValue ?? 0;

        this.form.patchValue({
          declarationNumber: d.declarationNumber ?? '',
          fobValue: fobUsd,
          cifValue: d.cifValueUsd ?? d.cifValue ?? 0,
          totalTaxes: d.totalTaxes ?? 0,
          freightValue: freightUsd,
          insuranceValue: insuranceUsd,
          notes: d.notes ?? ''
        });
        this.form.get('taxableBase')!.setValue(d.cifValue ?? 0, { emitEvent: false });

        if (d.exchangeRate) {
          this.form.get('exchangeRate')!.setValue(d.exchangeRate, { emitEvent: false });
          this.isManualRate = false;
          this.recalculateDop();
        }

        const fob = fobUsd;
        const ins = insuranceUsd;
        if (fob > 0) {
          this.form.get('insurancePercentage')!.setValue(Math.round(ins / fob * 100 * 100) / 100, { emitEvent: false });
        }
      });
    } else {
      this.declarationType = this.route.snapshot.queryParamMap.get('type') || 'PRELIMINARY';
      this.title.set(this.declarationType === 'PRELIMINARY' ? 'DECLARATIONS.REGISTER_PRELIMINARY' : 'DECLARATIONS.REGISTER_FINAL');
      this.cancelRoute.set(['/operations', String(this.operationId)]);
    }
  }

  private loadExchangeRate(): void {
    this.rateLoading = true;
    this.rateError = null;
    this.operationService.getById(this.operationId).subscribe(op => {
      if (op.estimatedArrival) {
        const dateStr = op.estimatedArrival.substring(0, 10);
        this.exchangeRateService.getForDate(dateStr).subscribe({
          next: (rate) => {
            this.currentRate = rate;
            this.rateLoading = false;
            if (!this.form.get('exchangeRate')!.value) {
              this.form.get('exchangeRate')!.setValue(rate.rate, { emitEvent: false });
              this.isManualRate = false;
              this.recalculateDop();
            }
          },
          error: () => {
            this.rateLoading = false;
            this.rateError = 'ERRORS.NO_EXCHANGE_RATE';
          }
        });
      } else {
        this.rateLoading = false;
        this.rateError = 'ERRORS.NO_EXCHANGE_RATE';
      }
    });
  }

  resetRate(): void {
    if (this.currentRate) {
      this.form.get('exchangeRate')!.setValue(this.currentRate.rate);
      this.isManualRate = false;
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
    const { insurancePercentage, exchangeRate, ...val } = this.form.getRawValue();
    const rate = exchangeRate || 0;

    // Map USD to DOP for backend compatibility
    const fobDop = Math.round((val.fobValue * rate) * 100) / 100;
    const freightDop = Math.round((val.freightValue * rate) * 100) / 100;
    const insuranceDop = Math.round((val.insuranceValue * rate) * 100) / 100;
    const cifDop = Math.round((fobDop + freightDop + insuranceDop) * 100) / 100;

    const request = {
      declarationNumber: val.declarationNumber,
      fobValue: rate ? fobDop : val.fobValue,
      cifValue: rate ? cifDop : val.cifValue,
      taxableBase: rate ? cifDop : val.taxableBase,
      totalTaxes: val.totalTaxes,
      freightValue: rate ? freightDop : val.freightValue,
      insuranceValue: rate ? insuranceDop : val.insuranceValue,
      notes: val.notes || undefined,
      fobValueUsd: val.fobValue,
      freightValueUsd: val.freightValue,
      insuranceValueUsd: val.insuranceValue,
      exchangeRate: exchangeRate || undefined
    };

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
