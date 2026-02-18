import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { OperationFormComponent } from './operation-form.component';
import { OperationService } from '../../../core/services/operation.service';
import { ClientService } from '../../../core/services/client.service';
import { CargoType, InspectionType, OperationStatus } from '../../../core/models/operation.model';

describe('OperationFormComponent', () => {
  let component: OperationFormComponent;
  let fixture: ComponentFixture<OperationFormComponent>;
  let operationServiceSpy: jasmine.SpyObj<OperationService>;
  let clientServiceSpy: jasmine.SpyObj<ClientService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    operationServiceSpy = jasmine.createSpyObj('OperationService', ['create', 'update', 'getById']);
    operationServiceSpy.create.and.returnValue(of({
      id: 10, referenceNumber: 'OP-010', clientId: 1, clientName: 'Client A',
      cargoType: CargoType.FCL, inspectionType: InspectionType.EXPRESS,
      status: OperationStatus.DRAFT, assignedAgentId: null, assignedAgentName: null, originCountry: null,
      notes: null, deadline: null, closedAt: null, createdAt: '2024-01-01', updatedAt: '2024-01-01'
    }));

    clientServiceSpy = jasmine.createSpyObj('ClientService', ['getAll']);
    clientServiceSpy.getAll.and.returnValue(of([
      { id: 1, name: 'Client A', taxId: '123', email: 'a@b.com', phone: null, address: null, active: true, createdAt: '2024-01-01' }
    ]));

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [OperationFormComponent, ReactiveFormsModule, TranslateModule.forRoot()],
      providers: [
        { provide: OperationService, useValue: operationServiceSpy },
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

    fixture = TestBed.createComponent(OperationFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values for new operation', () => {
    fixture.detectChanges();
    expect(component.isEdit()).toBeFalse();
    expect(component.form.get('clientId')!.value).toBe('');
    expect(component.form.get('cargoType')!.value).toBe(CargoType.FCL);
    expect(component.form.get('inspectionType')!.value).toBe(InspectionType.EXPRESS);
    expect(component.form.get('notes')!.value).toBe('');
  });

  it('should mark form invalid when required fields empty', () => {
    fixture.detectChanges();
    expect(component.form.invalid).toBeTrue();
    component.form.patchValue({ clientId: '1' });
    expect(component.form.valid).toBeTrue();
  });

  it('should call create on submit for new operations', () => {
    fixture.detectChanges();
    component.form.patchValue({ clientId: '1', cargoType: CargoType.FCL, inspectionType: InspectionType.EXPRESS, notes: '' });
    component.onSubmit();
    expect(operationServiceSpy.create).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/operations', 10]);
  });
});
