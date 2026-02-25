import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { DeclarationListComponent } from './declaration-list.component';
import { DeclarationService } from '../../../core/services/declaration.service';
import { AuthService } from '../../../core/services/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DeclarationType } from '../../../core/models/declaration.model';

describe('DeclarationListComponent', () => {
  let component: DeclarationListComponent;
  let fixture: ComponentFixture<DeclarationListComponent>;
  let declarationServiceSpy: jasmine.SpyObj<DeclarationService>;

  const mockDeclaration = {
    id: 1, operationId: 1, declarationType: DeclarationType.PRELIMINARY,
    declarationNumber: 'DECL-001', fobValue: 1000, cifValue: 1200,
    taxableBase: 1200, totalTaxes: 180, freightValue: 150, insuranceValue: 50,
    gattMethod: 'Method 1', gattCommercialLinks: null, gattCommissions: null, gattUnrecordedTransport: null,
    gattAdjustmentAmount: null, gattJustification: null, gattCompletedAt: null, gattCompletedBy: null,
    notes: null, submittedAt: null, createdAt: '2024-01-01T00:00:00',
    technicalApprovedBy: null, technicalApprovedAt: null, technicalApprovalComment: null,
    finalApprovedBy: null, finalApprovedAt: null, finalApprovalComment: null,
    rejectedBy: null, rejectedAt: null, rejectionComment: null
  };

  beforeEach(async () => {
    declarationServiceSpy = jasmine.createSpyObj('DeclarationService', ['getDeclarations']);
    declarationServiceSpy.getDeclarations.and.returnValue(of([mockDeclaration]));

    const authServiceSpy = jasmine.createSpyObj('AuthService', ['hasRole']);
    authServiceSpy.hasRole.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [DeclarationListComponent, TranslateModule.forRoot(), RouterTestingModule],
      providers: [
        { provide: DeclarationService, useValue: declarationServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NgbModal, useValue: jasmine.createSpyObj('NgbModal', ['open']) }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(DeclarationListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('operationId', 1);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load declarations on init', () => {
    expect(declarationServiceSpy.getDeclarations).toHaveBeenCalledWith(1);
    expect(component.declarations().length).toBe(1);
  });
});
