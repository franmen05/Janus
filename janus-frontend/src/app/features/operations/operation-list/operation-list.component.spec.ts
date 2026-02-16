import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { OperationListComponent } from './operation-list.component';
import { OperationService } from '../../../core/services/operation.service';
import { AuthService } from '../../../core/services/auth.service';
import { OperationStatus, CargoType, InspectionType, Operation } from '../../../core/models/operation.model';

describe('OperationListComponent', () => {
  let component: OperationListComponent;
  let fixture: ComponentFixture<OperationListComponent>;
  let operationServiceSpy: jasmine.SpyObj<OperationService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockOperations: Operation[] = [
    {
      id: 1, referenceNumber: 'OP-001', clientId: 1, clientName: 'Client A',
      cargoType: CargoType.FCL, inspectionType: InspectionType.EXPRESS,
      status: OperationStatus.DRAFT, assignedAgentId: null, assignedAgentName: null,
      notes: null, deadline: null, closedAt: null, createdAt: '2024-01-01', updatedAt: '2024-01-01'
    }
  ];

  beforeEach(async () => {
    operationServiceSpy = jasmine.createSpyObj('OperationService', ['getAll']);
    operationServiceSpy.getAll.and.returnValue(of(mockOperations));

    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasRole']);
    authServiceSpy.hasRole.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [OperationListComponent, RouterTestingModule, TranslateModule.forRoot(), FormsModule],
      providers: [
        { provide: OperationService, useValue: operationServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(OperationListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load operations on init', () => {
    fixture.detectChanges();
    expect(operationServiceSpy.getAll).toHaveBeenCalledWith(undefined);
    expect(component.operations().length).toBe(1);
  });

  it('should filter by status', () => {
    fixture.detectChanges();
    component.filterStatus = OperationStatus.DRAFT;
    component.loadOperations();
    expect(operationServiceSpy.getAll).toHaveBeenCalledWith(OperationStatus.DRAFT);
  });
});
