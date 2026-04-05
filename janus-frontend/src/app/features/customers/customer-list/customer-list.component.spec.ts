import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { CustomerListComponent } from './customer-list.component';
import { CustomerService } from '../../../core/services/customer.service';
import { AuthService } from '../../../core/services/auth.service';
import { Customer, CustomerType } from '../../../core/models/customer.model';

describe('CustomerListComponent', () => {
  let component: CustomerListComponent;
  let fixture: ComponentFixture<CustomerListComponent>;
  let customerServiceSpy: jasmine.SpyObj<CustomerService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockCustomers: Customer[] = [
    { id: 1, name: 'Customer A', taxId: '123-456', email: 'a@example.com', phone: '555-0001', address: '123 Main St', customerType: CustomerType.COMPANY, active: true, createdAt: '2024-01-01' },
    { id: 2, name: 'Customer B', taxId: '789-012', email: 'b@example.com', phone: null, address: null, customerType: CustomerType.CONSIGNEE, active: false, createdAt: '2024-01-02' }
  ];

  beforeEach(async () => {
    customerServiceSpy = jasmine.createSpyObj('CustomerService', ['getAll']);
    customerServiceSpy.getAll.and.returnValue(of(mockCustomers));

    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasRole']);
    authServiceSpy.hasRole.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [CustomerListComponent, RouterTestingModule, TranslateModule.forRoot()],
      providers: [
        { provide: CustomerService, useValue: customerServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load customers on init', () => {
    fixture.detectChanges();
    expect(customerServiceSpy.getAll).toHaveBeenCalled();
    expect(component.customers().length).toBe(2);
  });

  it('should display customer table', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Customer A');
    expect(rows[1].textContent).toContain('Customer B');
  });
});
