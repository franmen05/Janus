import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AccountCodeConfigService } from '../../accounts/services/account-code-config.service';
import { ToastService } from '../../../core/services/toast.service';
import { getErrorMessage } from '../../../core/utils/error-message.util';

@Component({
  selector: 'app-account-code-config',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule],
  template: `
    <h2 class="mb-4">{{ 'ADMIN.ACCOUNT_CODE_CONFIG.TITLE' | translate }}</h2>

    @if (loading()) {
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">{{ 'COMMON.LOADING' | translate }}</span>
        </div>
      </div>
    } @else {
      <div class="card">
        <div class="card-body">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="row mb-3">
              <div class="col-md-4">
                <label class="form-label">{{ 'ADMIN.ACCOUNT_CODE_CONFIG.PREFIX' | translate }} <span class="text-danger">*</span></label>
                <input type="text" class="form-control"
                       [class.is-invalid]="form.controls.prefix.invalid && (form.controls.prefix.touched || form.controls.prefix.dirty)"
                       formControlName="prefix">
                @if (form.controls.prefix.invalid && (form.controls.prefix.touched || form.controls.prefix.dirty)) {
                  <div class="invalid-feedback d-block">{{ 'ERRORS.ACCOUNT_CODE_CONFIG_INVALID_PREFIX' | translate }}</div>
                }
              </div>
              <div class="col-md-4">
                <label class="form-label">{{ 'ADMIN.ACCOUNT_CODE_CONFIG.SEPARATOR' | translate }}</label>
                <input type="text" class="form-control" formControlName="separator">
              </div>
              <div class="col-md-4">
                <label class="form-label">{{ 'ADMIN.ACCOUNT_CODE_CONFIG.PADDING' | translate }} <span class="text-danger">*</span></label>
                <input type="number" class="form-control"
                       [class.is-invalid]="form.controls.paddingLength.invalid && (form.controls.paddingLength.touched || form.controls.paddingLength.dirty)"
                       formControlName="paddingLength" min="1" max="10">
                @if (form.controls.paddingLength.invalid && (form.controls.paddingLength.touched || form.controls.paddingLength.dirty)) {
                  <div class="invalid-feedback d-block">{{ 'ERRORS.ACCOUNT_CODE_CONFIG_INVALID_PADDING' | translate }}</div>
                }
              </div>
            </div>
            <div class="mb-3">
              <div class="form-check form-switch">
                <input type="checkbox" class="form-check-input" role="switch" formControlName="enabled" id="cfg-enabled">
                <label class="form-check-label" for="cfg-enabled">
                  {{ 'ADMIN.ACCOUNT_CODE_CONFIG.ENABLED' | translate }}
                </label>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">{{ 'ADMIN.ACCOUNT_CODE_CONFIG.PREVIEW' | translate }}</label>
              <div><code>{{ preview() }}</code></div>
            </div>
            <div class="d-flex gap-2">
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
                {{ 'ACTIONS.SAVE' | translate }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class AccountCodeConfigComponent implements OnInit {
  private service = inject(AccountCodeConfigService);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);

  loading = signal(true);
  saving = signal(false);

  // Live form value tracker for the preview
  private formValue = signal<{ prefix: string; separator: string; paddingLength: number }>({
    prefix: '',
    separator: '',
    paddingLength: 1
  });

  preview = computed(() => {
    const v = this.formValue();
    const len = Math.max(1, Math.min(10, Number(v.paddingLength) || 1));
    const padded = '1'.padStart(len, '0');
    return `${v.prefix ?? ''}${v.separator ?? ''}${padded}`;
  });

  form = new FormGroup({
    prefix: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    separator: new FormControl('', { nonNullable: true }),
    paddingLength: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(10)]
    }),
    enabled: new FormControl(false, { nonNullable: true })
  });

  ngOnInit(): void {
    this.form.valueChanges.subscribe(v => {
      this.formValue.set({
        prefix: v.prefix ?? '',
        separator: v.separator ?? '',
        paddingLength: v.paddingLength ?? 1
      });
    });

    this.service.get().subscribe({
      next: cfg => {
        this.form.patchValue(cfg);
        this.formValue.set({
          prefix: cfg.prefix,
          separator: cfg.separator,
          paddingLength: cfg.paddingLength
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.error(getErrorMessage(err, this.translate));
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    this.service.update(raw).subscribe({
      next: cfg => {
        this.form.patchValue(cfg);
        this.saving.set(false);
        this.toastService.success(this.translate.instant('ADMIN.ACCOUNT_CODE_CONFIG.SAVE_SUCCESS'));
      },
      error: (err) => {
        this.saving.set(false);
        this.toastService.error(getErrorMessage(err, this.translate));
      }
    });
  }
}
