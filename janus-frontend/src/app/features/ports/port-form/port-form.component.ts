import { Component, inject, OnInit, signal } from '@angular/core';

import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PortService } from '../../../core/services/port.service';

@Component({
  selector: 'app-port-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule],
  template: `
    <h2 class="mb-4">{{ (isEdit() ? 'PORTS.EDIT_TITLE' : 'PORTS.NEW_TITLE') | translate }}</h2>
    <div class="card">
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'PORTS.CODE' | translate }} <span class="text-danger">*</span></label>
              <input type="text" class="form-control" formControlName="code">
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'PORTS.NAME' | translate }} <span class="text-danger">*</span></label>
              <input type="text" class="form-control" formControlName="name">
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'PORTS.ADDRESS' | translate }}</label>
              <input type="text" class="form-control" formControlName="address">
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'PORTS.COUNTRY' | translate }}</label>
              <input type="text" class="form-control" formControlName="country" maxlength="2"
                     [placeholder]="'HN'" style="text-transform: uppercase;">
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">{{ 'PORTS.DESCRIPTION' | translate }}</label>
            <textarea class="form-control" formControlName="description" rows="2"></textarea>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <div class="form-check">
                <input type="checkbox" class="form-check-input" formControlName="originPort" id="originPort">
                <label class="form-check-label" for="originPort">{{ 'PORTS.ORIGIN_PORT' | translate }}</label>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-check">
                <input type="checkbox" class="form-check-input" formControlName="arrivalPort" id="arrivalPort">
                <label class="form-check-label" for="arrivalPort">{{ 'PORTS.ARRIVAL_PORT' | translate }}</label>
              </div>
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
export class PortFormComponent implements OnInit {
  private portService = inject(PortService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = signal(false);
  portId: number | null = null;

  form = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    address: new FormControl('', { nonNullable: true }),
    country: new FormControl('', { nonNullable: true }),
    originPort: new FormControl(true, { nonNullable: true }),
    arrivalPort: new FormControl(true, { nonNullable: true })
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.portId = +id;
      this.portService.getById(+id).subscribe(p => {
        this.form.patchValue({ code: p.code, name: p.name, description: p.description ?? '', address: p.address ?? '', country: p.country ?? '', originPort: p.originPort, arrivalPort: p.arrivalPort });
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    const request = { code: val.code, name: val.name, description: val.description || undefined, address: val.address || undefined, country: val.country || undefined, originPort: val.originPort, arrivalPort: val.arrivalPort };
    const obs = this.isEdit() ? this.portService.update(this.portId!, request) : this.portService.create(request);
    obs.subscribe(() => this.router.navigate(['/ports']));
  }

  onCancel(): void { this.router.navigate(['/ports']); }
}
