import { Component, inject, OnInit, signal } from '@angular/core';

import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DepositoService } from '../../../core/services/deposito.service';

@Component({
  selector: 'app-deposito-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule],
  template: `
    <h2 class="mb-4">{{ (isEdit() ? 'DEPOSITOS.EDIT_TITLE' : 'DEPOSITOS.NEW_TITLE') | translate }}</h2>
    <div class="card">
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'DEPOSITOS.CODE' | translate }} <span class="text-danger">*</span></label>
              <input type="text" class="form-control" formControlName="code">
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'DEPOSITOS.NAME' | translate }} <span class="text-danger">*</span></label>
              <input type="text" class="form-control" formControlName="name">
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">{{ 'DEPOSITOS.DESCRIPTION' | translate }}</label>
            <textarea class="form-control" formControlName="description" rows="2"></textarea>
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
export class DepositoFormComponent implements OnInit {
  private depositoService = inject(DepositoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = signal(false);
  depositoId: number | null = null;

  form = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true })
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.depositoId = +id;
      this.depositoService.getById(+id).subscribe(d => {
        this.form.patchValue({ code: d.code, name: d.name, description: d.description ?? '' });
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    const request = { code: val.code, name: val.name, description: val.description || undefined };
    const obs = this.isEdit() ? this.depositoService.update(this.depositoId!, request) : this.depositoService.create(request);
    obs.subscribe(() => this.router.navigate(['/depositos']));
  }

  onCancel(): void { this.router.navigate(['/depositos']); }
}
