import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { UserService } from '../../../core/services/user.service';
import { ClientService } from '../../../core/services/client.service';
import { Role } from '../../../core/models/user.model';
import { Client } from '../../../core/models/client.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <h2 class="mb-4">{{ (isEdit() ? 'USERS.EDIT_TITLE' : 'USERS.NEW_TITLE') | translate }}</h2>
    <div class="card">
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'USERS.USERNAME' | translate }}</label>
              <input type="text" class="form-control" formControlName="username" [readonly]="isEdit()">
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'USERS.PASSWORD' | translate }}</label>
              <input type="password" class="form-control" formControlName="password">
              @if (isEdit()) {
                <small class="form-text text-muted">{{ 'USERS.PASSWORD_HINT' | translate }}</small>
              }
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'USERS.FULL_NAME' | translate }}</label>
              <input type="text" class="form-control" formControlName="fullName">
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'USERS.EMAIL' | translate }}</label>
              <input type="email" class="form-control" formControlName="email">
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'USERS.ROLE' | translate }}</label>
              <select class="form-select" formControlName="role">
                @for (r of roles; track r) {
                  <option [value]="r">{{ 'ROLES.' + r | translate }}</option>
                }
              </select>
            </div>
            @if (form.get('role')?.value === 'CLIENT') {
              <div class="col-md-6">
                <label class="form-label">{{ 'USERS.CLIENT' | translate }}</label>
                <select class="form-select" formControlName="clientId">
                  <option [ngValue]="null">--</option>
                  @for (c of clients(); track c.id) {
                    <option [ngValue]="c.id">{{ c.name }}</option>
                  }
                </select>
              </div>
            }
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
export class UserFormComponent implements OnInit {
  private userService = inject(UserService);
  private clientService = inject(ClientService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = signal(false);
  userId: number | null = null;
  roles = Object.values(Role);
  clients = signal<Client[]>([]);

  form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    role: new FormControl('AGENT', { nonNullable: true, validators: [Validators.required] }),
    clientId: new FormControl<number | null>(null)
  });

  ngOnInit(): void {
    this.clientService.getAll().subscribe(clients => this.clients.set(clients));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.userId = +id;
      this.form.get('password')!.removeValidators(Validators.required);
      this.form.get('password')!.updateValueAndValidity();
      this.userService.getById(+id).subscribe(u => {
        this.form.patchValue({
          username: u.username,
          fullName: u.fullName,
          email: u.email,
          role: u.role,
          clientId: u.clientId
        });
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    if (this.isEdit()) {
      this.userService.update(this.userId!, {
        fullName: val.fullName,
        email: val.email,
        role: val.role as Role,
        clientId: val.clientId,
        active: true,
        password: val.password || null
      }).subscribe(() => this.router.navigate(['/users']));
    } else {
      this.userService.create({
        username: val.username,
        password: val.password,
        fullName: val.fullName,
        email: val.email,
        role: val.role as Role,
        clientId: val.clientId
      }).subscribe(() => this.router.navigate(['/users']));
    }
  }

  onCancel(): void {
    this.router.navigate(['/users']);
  }
}
