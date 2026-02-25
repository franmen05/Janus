import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import { DeclarationFormComponent } from './declaration-form.component';
import { DeclarationService } from '../../../core/services/declaration.service';
import { DeclarationType } from '../../../core/models/declaration.model';

describe('DeclarationFormComponent', () => {
  let component: DeclarationFormComponent;
  let fixture: ComponentFixture<DeclarationFormComponent>;
  let declarationServiceSpy: jasmine.SpyObj<DeclarationService>;
  let activeModalSpy: jasmine.SpyObj<NgbActiveModal>;

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
    declarationServiceSpy = jasmine.createSpyObj('DeclarationService', ['createPreliminary', 'createFinal']);
    declarationServiceSpy.createPreliminary.and.returnValue(of(mockDeclaration));
    declarationServiceSpy.createFinal.and.returnValue(of(mockDeclaration));
    activeModalSpy = jasmine.createSpyObj('NgbActiveModal', ['close', 'dismiss']);

    await TestBed.configureTestingModule({
      imports: [DeclarationFormComponent, ReactiveFormsModule, TranslateModule.forRoot()],
      providers: [
        { provide: DeclarationService, useValue: declarationServiceSpy },
        { provide: NgbActiveModal, useValue: activeModalSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeclarationFormComponent);
    component = fixture.componentInstance;
    component.operationId = 1;
    component.declarationType = 'PRELIMINARY';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should submit preliminary declaration', () => {
    component.form.patchValue({
      declarationNumber: 'DECL-001', fobValue: 1000, cifValue: 1200,
      taxableBase: 1200, totalTaxes: 180, freightValue: 150, insuranceValue: 50,
      gattMethod: 'Method 1'
    });
    component.onSubmit();
    expect(declarationServiceSpy.createPreliminary).toHaveBeenCalled();
  });

  it('should submit final declaration', () => {
    component.declarationType = 'FINAL';
    component.form.patchValue({
      declarationNumber: 'DECL-002', fobValue: 1000, cifValue: 1200,
      taxableBase: 1200, totalTaxes: 180, freightValue: 150, insuranceValue: 50,
      gattMethod: 'Method 1'
    });
    component.onSubmit();
    expect(declarationServiceSpy.createFinal).toHaveBeenCalled();
  });

  it('should not submit invalid form', () => {
    component.onSubmit();
    expect(declarationServiceSpy.createPreliminary).not.toHaveBeenCalled();
  });
});
