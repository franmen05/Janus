import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ClientFormComponent } from './client-form.component';
import { ClientService } from '../../../core/services/client.service';

describe('ClientFormComponent', () => {
  let component: ClientFormComponent;
  let fixture: ComponentFixture<ClientFormComponent>;
  let clientServiceSpy: jasmine.SpyObj<ClientService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    clientServiceSpy = jasmine.createSpyObj('ClientService', ['create', 'update', 'getById']);
    clientServiceSpy.create.and.returnValue(of({
      id: 10, name: 'New Client', taxId: '999', email: 'new@test.com',
      phone: null, address: null, active: true, createdAt: '2024-01-01'
    }));

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ClientFormComponent, ReactiveFormsModule, TranslateModule.forRoot()],
      providers: [
        { provide: ClientService, useValue: clientServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({}) }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ClientFormComponent);
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
      name: 'Test Client',
      taxId: '123-456',
      email: 'test@example.com'
    });
    expect(component.form.valid).toBeTrue();
  });

  it('should call create service on submit', () => {
    fixture.detectChanges();
    component.form.patchValue({
      name: 'New Client',
      taxId: '999',
      email: 'new@test.com',
      phone: '',
      address: ''
    });

    component.onSubmit();

    expect(clientServiceSpy.create).toHaveBeenCalledWith({
      name: 'New Client',
      taxId: '999',
      email: 'new@test.com',
      phone: '',
      address: ''
    });
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/clients']);
  });
});
