import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <h2 class="mb-4">{{ isEdit() ? 'Edit' : 'New' }} Client</h2>
    <div class="card">
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">Name</label>
              <input type="text" class="form-control" formControlName="name">
            </div>
            <div class="col-md-6">
              <label class="form-label">Tax ID</label>
              <input type="text" class="form-control" formControlName="taxId">
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" formControlName="email">
            </div>
            <div class="col-md-6">
              <label class="form-label">Phone</label>
              <input type="text" class="form-control" formControlName="phone">
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">Address</label>
            <textarea class="form-control" formControlName="address" rows="2"></textarea>
          </div>
          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid">{{ isEdit() ? 'Update' : 'Create' }}</button>
            <button type="button" class="btn btn-outline-secondary" (click)="onCancel()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ClientFormComponent implements OnInit {
  private clientService = inject(ClientService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = signal(false);
  clientId: number | null = null;

  form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    taxId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    phone: new FormControl('', { nonNullable: true }),
    address: new FormControl('', { nonNullable: true })
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.clientId = +id;
      this.clientService.getById(+id).subscribe(c => {
        this.form.patchValue({ name: c.name, taxId: c.taxId, email: c.email, phone: c.phone ?? '', address: c.address ?? '' });
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    const obs = this.isEdit() ? this.clientService.update(this.clientId!, val) : this.clientService.create(val);
    obs.subscribe(() => this.router.navigate(['/clients']));
  }

  onCancel(): void { this.router.navigate(['/clients']); }
}
