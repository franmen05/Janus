import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AccountListComponent } from './account-list.component';
import { AccountService } from '../../../core/services/account.service';
import { AuthService } from '../../../core/services/auth.service';
import { Account, AccountType } from '../../../core/models/account.model';

describe('AccountListComponent', () => {
  let component: AccountListComponent;
  let fixture: ComponentFixture<AccountListComponent>;
  let accountServiceSpy: jasmine.SpyObj<AccountService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockAccounts: Account[] = [
    { id: 1, name: 'Account A', taxId: '123-456', email: 'a@example.com', phone: '555-0001', address: '123 Main St', accountTypes: [AccountType.COMPANY], active: true, createdAt: '2024-01-01' },
    { id: 2, name: 'Account B', taxId: '789-012', email: 'b@example.com', phone: null, address: null, accountTypes: [AccountType.CONSIGNEE], active: false, createdAt: '2024-01-02' }
  ];

  beforeEach(async () => {
    accountServiceSpy = jasmine.createSpyObj('AccountService', ['getAll']);
    accountServiceSpy.getAll.and.returnValue(of(mockAccounts));

    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasRole']);
    authServiceSpy.hasRole.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [AccountListComponent, RouterTestingModule, TranslateModule.forRoot()],
      providers: [
        { provide: AccountService, useValue: accountServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AccountListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load accounts on init', () => {
    fixture.detectChanges();
    expect(accountServiceSpy.getAll).toHaveBeenCalled();
    expect(component.accounts().length).toBe(2);
  });

  it('should display account table', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Account A');
    expect(rows[1].textContent).toContain('Account B');
  });
});
