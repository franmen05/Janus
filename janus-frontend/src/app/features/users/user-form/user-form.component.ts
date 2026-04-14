import { Component, inject, OnInit, signal } from '@angular/core';

import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { OperatorFunction, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { UserService } from '../../../core/services/user.service';
import { AccountService } from '../../../core/services/account.service';
import { Role } from '../../../core/models/user.model';
import { Account } from '../../../core/models/account.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, NgbTypeaheadModule],
  template: `
    <h2 class="mb-4">{{ (isEdit() ? 'USERS.EDIT_TITLE' : 'USERS.NEW_TITLE') | translate }}</h2>
    <div class="card">
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'USERS.USERNAME' | translate }} <span class="text-danger">*</span></label>
              <input type="text" class="form-control" formControlName="username" [readonly]="isEdit()">
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'USERS.PASSWORD' | translate }} @if (!isEdit()) { <span class="text-danger">*</span> }</label>
              <input type="password" class="form-control" formControlName="password">
              @if (isEdit()) {
                <small class="form-text text-muted">{{ 'USERS.PASSWORD_HINT' | translate }}</small>
              }
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'USERS.FULL_NAME' | translate }} <span class="text-danger">*</span></label>
              <input type="text" class="form-control" formControlName="fullName">
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ 'USERS.EMAIL' | translate }} <span class="text-danger">*</span></label>
              <input type="email" class="form-control" formControlName="email">
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'USERS.ROLES' | translate }} <span class="text-danger">*</span></label>
              <div class="d-flex flex-wrap gap-2">
                @for (r of availableRoles; track r) {
                  <div class="form-check">
                    <input type="checkbox" class="form-check-input" [id]="'role-' + r"
                      [checked]="isRoleSelected(r)" (change)="toggleRole(r)">
                    <label class="form-check-label" [for]="'role-' + r">{{ 'ROLES.' + r | translate }}</label>
                  </div>
                }
              </div>
            </div>
            @if (isRoleSelected('CUSTOMER')) {
              <div class="col-md-6">
                <label class="form-label">{{ 'USERS.ACCOUNT' | translate }}</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-search"></i></span>
                  <input type="text" class="form-control"
                    [ngbTypeahead]="searchAccount"
                    [resultFormatter]="accountResultFormatter"
                    [inputFormatter]="accountInputFormatter"
                    (selectItem)="onAccountSelected($event)"
                    [value]="selectedAccountDisplay()"
                    placeholder="{{ 'USERS.ACCOUNT_SEARCH_PLACEHOLDER' | translate }}" />
                </div>
                @if (selectedAccount()) {
                  <div class="mt-1 d-flex align-items-center gap-2">
                    <span class="badge bg-primary">{{ selectedAccount()!.name }}</span>
                    <small class="text-muted">{{ selectedAccount()!.taxId }}</small>
                    <button type="button" class="btn btn-link btn-sm text-danger p-0" (click)="clearAccount()">
                      <i class="bi bi-x-circle"></i>
                    </button>
                  </div>
                }
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
  private accountService = inject(AccountService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = signal(false);
  userId: number | null = null;
  availableRoles = Object.values(Role);
  accounts = signal<Account[]>([]);
  selectedAccount = signal<Account | null>(null);
  selectedAccountDisplay = signal('');

  form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    roles: new FormControl<string[]>(['AGENT'], { nonNullable: true, validators: [Validators.required] }),
    accountId: new FormControl<number | null>(null)
  });

  searchAccount: OperatorFunction<string, Account[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => {
        if (term.length < 1) return this.accounts().filter(c => c.active).slice(0, 10);
        const lower = term.toLowerCase();
        return this.accounts().filter(c => c.active &&
          (c.name.toLowerCase().includes(lower) ||
           c.taxId?.toLowerCase().includes(lower) ||
           c.email?.toLowerCase().includes(lower))
        ).slice(0, 10);
      })
    );

  accountResultFormatter = (account: Account) =>
    `${account.name}  —  ${account.taxId || ''}  ${account.email ? '· ' + account.email : ''}`;

  accountInputFormatter = (account: Account) => account.name;

  onAccountSelected(event: any): void {
    const account = event.item as Account;
    this.selectedAccount.set(account);
    this.selectedAccountDisplay.set(account.name);
    this.form.get('accountId')!.setValue(account.id);
  }

  isRoleSelected(role: string): boolean {
    return this.form.get('roles')!.value.includes(role);
  }

  toggleRole(role: string): void {
    const current = this.form.get('roles')!.value as string[];
    if (current.includes(role)) {
      this.form.get('roles')!.setValue(current.filter(r => r !== role));
    } else {
      this.form.get('roles')!.setValue([...current, role]);
    }
  }

  clearAccount(): void {
    this.selectedAccount.set(null);
    this.selectedAccountDisplay.set('');
    this.form.get('accountId')!.setValue(null);
  }

  ngOnInit(): void {
    this.accountService.getAll(0, 9999).subscribe(response => {
      const accounts = response.content;
      this.accounts.set(accounts);

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
            roles: u.roles,
            accountId: u.accountId
          });
          if (u.accountId) {
            const account = accounts.find((c: Account) => c.id === u.accountId);
            if (account) {
              this.selectedAccount.set(account);
              this.selectedAccountDisplay.set(account.name);
            }
          }
        });
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    if (this.isEdit()) {
      this.userService.update(this.userId!, {
        fullName: val.fullName,
        email: val.email,
        roles: val.roles as Role[],
        accountId: val.accountId,
        active: true,
        password: val.password || null
      }).subscribe(() => this.router.navigate(['/users']));
    } else {
      this.userService.create({
        username: val.username,
        password: val.password,
        fullName: val.fullName,
        email: val.email,
        roles: val.roles as Role[],
        accountId: val.accountId
      }).subscribe(() => this.router.navigate(['/users']));
    }
  }

  onCancel(): void {
    this.router.navigate(['/users']);
  }
}
