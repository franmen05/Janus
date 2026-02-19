import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { OperationStatusComponent } from './operation-status.component';
import { OperationService } from '../../../core/services/operation.service';
import { ComplianceService } from '../../../core/services/compliance.service';
import { AuthService } from '../../../core/services/auth.service';
import { OperationStatus, StatusHistory } from '../../../core/models/operation.model';

describe('OperationStatusComponent', () => {
  let component: OperationStatusComponent;
  let fixture: ComponentFixture<OperationStatusComponent>;
  let operationServiceSpy: jasmine.SpyObj<OperationService>;
  let complianceServiceSpy: jasmine.SpyObj<ComplianceService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockHistory: StatusHistory[] = [
    {
      id: 1, previousStatus: null, newStatus: OperationStatus.DRAFT,
      changedByUsername: 'admin', comment: 'Created', changedAt: '2024-01-01T10:00:00', ipAddress: null
    },
    {
      id: 2, previousStatus: OperationStatus.DRAFT, newStatus: OperationStatus.DOCUMENTATION_COMPLETE,
      changedByUsername: 'agent1', comment: 'Docs complete', changedAt: '2024-01-02T10:00:00', ipAddress: null
    }
  ];

  beforeEach(async () => {
    operationServiceSpy = jasmine.createSpyObj('OperationService', ['getHistory', 'changeStatus', 'getAllowedTransitions']);
    operationServiceSpy.getHistory.and.returnValue(of(mockHistory));
    operationServiceSpy.changeStatus.and.returnValue(of(void 0));
    operationServiceSpy.getAllowedTransitions.and.returnValue(of([]));

    complianceServiceSpy = jasmine.createSpyObj('ComplianceService', ['validate']);
    complianceServiceSpy.validate.and.returnValue(of({ passed: true, errors: [] }));

    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasRole']);
    authServiceSpy.hasRole.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [OperationStatusComponent, FormsModule, TranslateModule.forRoot()],
      providers: [
        { provide: OperationService, useValue: operationServiceSpy },
        { provide: ComplianceService, useValue: complianceServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(OperationStatusComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('operationId', 1);
    fixture.componentRef.setInput('currentStatus', OperationStatus.DRAFT);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display status history', () => {
    fixture.detectChanges();
    expect(operationServiceSpy.getHistory).toHaveBeenCalledWith(1);
    expect(component.timelineEvents().length).toBe(2);
  });

  it('should validate before changing status', () => {
    fixture.detectChanges();
    spyOn(component.statusChanged, 'emit');

    component.selectedStatus = OperationStatus.DOCUMENTATION_COMPLETE;
    component.comment = 'All docs ready';
    component.onChangeStatus();

    expect(complianceServiceSpy.validate).toHaveBeenCalledWith(1, OperationStatus.DOCUMENTATION_COMPLETE);
    expect(operationServiceSpy.changeStatus).toHaveBeenCalled();
    expect(component.statusChanged.emit).toHaveBeenCalled();
  });

  it('should block status change when validation fails', () => {
    complianceServiceSpy.validate.and.returnValue(of({
      passed: false,
      errors: [
        { ruleCode: 'RULE_001', message: 'Missing required documents' }
      ]
    }));

    fixture.detectChanges();
    component.selectedStatus = OperationStatus.DOCUMENTATION_COMPLETE;
    component.onChangeStatus();

    expect(complianceServiceSpy.validate).toHaveBeenCalled();
    expect(operationServiceSpy.changeStatus).not.toHaveBeenCalled();
    expect(component.validationErrors().length).toBe(1);
    expect(component.validationErrors()[0].ruleCode).toBe('RULE_001');
  });

  it('should proceed with status change if validation service fails', () => {
    complianceServiceSpy.validate.and.returnValue(throwError(() => new Error('Service unavailable')));

    fixture.detectChanges();
    spyOn(component.statusChanged, 'emit');

    component.selectedStatus = OperationStatus.DOCUMENTATION_COMPLETE;
    component.onChangeStatus();

    expect(operationServiceSpy.changeStatus).toHaveBeenCalled();
    expect(component.statusChanged.emit).toHaveBeenCalled();
  });
});
