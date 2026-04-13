import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { CustomerFormComponent } from './customer-form.component';
import { CustomerService } from '../../../core/services/customer.service';
import { CustomerType } from '../../../core/models/customer.model';

describe('CustomerFormComponent', () => {
  let component: CustomerFormComponent;
  let fixture: ComponentFixture<CustomerFormComponent>;
  let customerServiceSpy: jasmine.SpyObj<CustomerService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    customerServiceSpy = jasmine.createSpyObj('CustomerService', ['create', 'update', 'getById']);
    customerServiceSpy.create.and.returnValue(of({
      id: 10, name: 'New Customer', taxId: '999', email: 'new@test.com',
      phone: null, address: null, customerTypes: [CustomerType.COMPANY], active: true, createdAt: '2024-01-01'
    }));

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [CustomerFormComponent, ReactiveFormsModule, TranslateModule.forRoot()],
      providers: [
        { provide: CustomerService, useValue: customerServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({}) }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerFormComponent);
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
      name: 'Test Customer',
      taxId: '123-456',
      email: 'test@example.com'
    });
    component.selectedTypes.set([CustomerType.COMPANY]);
    expect(component.form.valid).toBeTrue();
  });

  it('should call create service on submit', () => {
    fixture.detectChanges();
    component.form.patchValue({
      name: 'New Customer',
      taxId: '999',
      email: 'new@test.com',
      phone: '',
      address: ''
    });
    component.selectedTypes.set([CustomerType.COMPANY]);

    component.onSubmit();

    expect(customerServiceSpy.create).toHaveBeenCalledWith(jasmine.objectContaining({
      name: 'New Customer',
      taxId: '999',
      email: 'new@test.com',
      customerTypes: [CustomerType.COMPANY]
    }));
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/customers']);
  });
});
