import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AccountFormComponent } from './account-form.component';
import { AccountService } from '../../../core/services/account.service';
import { AccountType } from '../../../core/models/account.model';

describe('AccountFormComponent', () => {
  let component: AccountFormComponent;
  let fixture: ComponentFixture<AccountFormComponent>;
  let accountServiceSpy: jasmine.SpyObj<AccountService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    accountServiceSpy = jasmine.createSpyObj('AccountService', ['create', 'update', 'getById']);
    accountServiceSpy.create.and.returnValue(of({
      id: 10, name: 'New Account', taxId: '999', email: 'new@test.com',
      phone: null, address: null, accountTypes: [AccountType.COMPANY], active: true, createdAt: '2024-01-01'
    }));

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [AccountFormComponent, ReactiveFormsModule, TranslateModule.forRoot()],
      providers: [
        { provide: AccountService, useValue: accountServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({}) }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AccountFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    fixture.detectChanges();
    expect(component.isEdit()).toBeFalse();
    expect(component.form.get('name')!.value).toBe('');
    expect(component.form.get('taxId')!.value).toBe('');
    expect(component.form.get('email')!.value).toBe('');
    expect(component.form.get('phone')!.value).toBe('');
    expect(component.form.get('address')!.value).toBe('');
  });

  it('should mark form invalid when required fields empty', () => {
    fixture.detectChanges();
    expect(component.form.invalid).toBeTrue();

    component.form.patchValue({
      name: 'Test Account',
      taxId: '123-456',
      email: 'test@example.com'
    });
    component.selectedTypes.set([AccountType.COMPANY]);
    expect(component.form.valid).toBeTrue();
  });

  it('should call create service on submit', () => {
    fixture.detectChanges();
    component.form.patchValue({
      name: 'New Account',
      taxId: '999',
      email: 'new@test.com',
      phone: '',
      address: ''
    });
    component.selectedTypes.set([AccountType.COMPANY]);

    component.onSubmit();

    expect(accountServiceSpy.create).toHaveBeenCalledWith(jasmine.objectContaining({
      name: 'New Account',
      taxId: '999',
      email: 'new@test.com',
      accountTypes: [AccountType.COMPANY]
    }));
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/accounts']);
  });
});
