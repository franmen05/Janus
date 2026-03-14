import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ExchangeRateService } from '../../../core/services/exchange-rate.service';

@Component({
  selector: 'app-exchange-rate-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <h2 class="mb-4">{{ (isEdit() ? 'EXCHANGE_RATES.EDIT_TITLE' : 'EXCHANGE_RATES.CREATE_TITLE') | translate }}</h2>
    <div class="card">
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'EXCHANGE_RATES.RATE' | translate }} ({{ 'EXCHANGE_RATES.USD_TO_DOP' | translate }}) <span class="text-danger">*</span></label>
              <input type="number" class="form-control" formControlName="rate" step="0.0001" [placeholder]="'EXCHANGE_RATES.RATE_PLACEHOLDER' | translate">
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'EXCHANGE_RATES.EFFECTIVE_DATE' | translate }} <span class="text-danger">*</span></label>
              <input type="date" class="form-control" formControlName="effectiveDate">
            </div>
          </div>
          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid">{{ (isEdit() ? 'ACTIONS.UPDATE' : 'ACTIONS.CREATE') | translate }}</button>
            <button type="button" class="btn btn-outline-secondary" (click)="onCancel()">{{ 'ACTIONS.CANCEL' | translate }}</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ExchangeRateFormComponent implements OnInit {
  private exchangeRateService = inject(ExchangeRateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = signal(false);
  rateId: number | null = null;

  form = new FormGroup({
    rate: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0.0001)] }),
    effectiveDate: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.rateId = +id;
      this.exchangeRateService.getById(+id).subscribe(r => {
        this.form.patchValue({ rate: r.rate, effectiveDate: r.effectiveDate });
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    const request = { rate: val.rate!, effectiveDate: val.effectiveDate };
    const obs = this.isEdit() ? this.exchangeRateService.update(this.rateId!, request) : this.exchangeRateService.create(request);
    obs.subscribe(() => this.router.navigate(['/exchange-rates']));
  }

  onCancel(): void { this.router.navigate(['/exchange-rates']); }
}
