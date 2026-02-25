import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { OperationDetailComponent } from './operation-detail.component';
import { OperationService } from '../../../core/services/operation.service';
import { AuditService } from '../../../core/services/audit.service';
import { DocumentService } from '../../../core/services/document.service';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';
import { ComplianceService } from '../../../core/services/compliance.service';
import { DeclarationService } from '../../../core/services/declaration.service';
import { OperationStatus, TransportMode, OperationCategory, Operation } from '../../../core/models/operation.model';
import { DocumentType } from '../../../core/models/document.model';

describe('OperationDetailComponent', () => {
  let component: OperationDetailComponent;
  let fixture: ComponentFixture<OperationDetailComponent>;
  let operationServiceSpy: jasmine.SpyObj<OperationService>;
  let auditServiceSpy: jasmine.SpyObj<AuditService>;
  let documentServiceSpy: jasmine.SpyObj<DocumentService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockOperation: Operation = {
    id: 1, referenceNumber: 'OP-001', clientId: 1, clientName: 'Client A',
    transportMode: TransportMode.MARITIME, operationCategory: OperationCategory.CATEGORY_1,
    status: OperationStatus.DRAFT, assignedAgentId: null, assignedAgentName: null,
    blNumber: 'BL-001', containerNumber: 'CONT-001', estimatedArrival: '2024-02-01T10:00:00', blAvailability: 'NOT_AVAILABLE' as any, blOriginalAvailable: false,
    notes: 'Test notes', deadline: null, closedAt: null, createdAt: '2024-01-01', updatedAt: '2024-01-01'
  };

  beforeEach(async () => {
    operationServiceSpy = jasmine.createSpyObj('OperationService', ['getById', 'getCompleteness', 'delete']);
    operationServiceSpy.getById.and.returnValue(of(mockOperation));
    operationServiceSpy.getCompleteness.and.returnValue(of({ percentage: 50, missingDocuments: [DocumentType.BL], color: 'warning' }));

    auditServiceSpy = jasmine.createSpyObj('AuditService', ['getByOperation']);
    auditServiceSpy.getByOperation.and.returnValue(of([]));

    documentServiceSpy = jasmine.createSpyObj('DocumentService', ['getByOperation']);
    documentServiceSpy.getByOperation.and.returnValue(of([]));

    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasRole']);
    authServiceSpy.hasRole.and.returnValue(true);

    const alertServiceSpy = jasmine.createSpyObj('AlertService', ['getByOperation', 'acknowledge']);
    alertServiceSpy.getByOperation.and.returnValue(of([]));

    const complianceServiceSpy = jasmine.createSpyObj('ComplianceService', ['validate']);
    complianceServiceSpy.validate.and.returnValue(of({ valid: true, errors: [] }));

    const declarationServiceSpy = jasmine.createSpyObj('DeclarationService', ['getDeclarations', 'approveTechnical', 'approveFinal', 'reject']);
    declarationServiceSpy.getDeclarations.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [OperationDetailComponent, RouterTestingModule, TranslateModule.forRoot()],
      providers: [
        { provide: OperationService, useValue: operationServiceSpy },
        { provide: AuditService, useValue: auditServiceSpy },
        { provide: DocumentService, useValue: documentServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: AlertService, useValue: alertServiceSpy },
        { provide: ComplianceService, useValue: complianceServiceSpy },
        { provide: DeclarationService, useValue: declarationServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: '1' })),
            snapshot: {
              paramMap: convertToParamMap({ id: '1' }),
              queryParamMap: convertToParamMap({})
            }
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(OperationDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load operation on init', () => {
    fixture.detectChanges();
    expect(operationServiceSpy.getById).toHaveBeenCalledWith(1);
    expect(component.operation()).toEqual(mockOperation);
  });

  it('should show progress bar', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-progress-bar')).toBeTruthy();
  });
});
