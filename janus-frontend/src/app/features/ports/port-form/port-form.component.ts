import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PortService } from '../../../core/services/port.service';

@Component({
  selector: 'app-port-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
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
          <div class="mb-3">
            <label class="form-label">{{ 'PORTS.DESCRIPTION' | translate }}</label>
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
export class PortFormComponent implements OnInit {
  private portService = inject(PortService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = signal(false);
  portId: number | null = null;

  form = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true })
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.portId = +id;
      this.portService.getById(+id).subscribe(p => {
        this.form.patchValue({ code: p.code, name: p.name, description: p.description ?? '' });
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    const request = { code: val.code, name: val.name, description: val.description || undefined };
    const obs = this.isEdit() ? this.portService.update(this.portId!, request) : this.portService.create(request);
    obs.subscribe(() => this.router.navigate(['/ports']));
  }

  onCancel(): void { this.router.navigate(['/ports']); }
}
