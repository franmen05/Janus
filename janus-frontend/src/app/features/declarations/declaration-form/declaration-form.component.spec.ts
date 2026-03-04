import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { DeclarationFormComponent } from './declaration-form.component';
import { DeclarationService } from '../../../core/services/declaration.service';
import { DeclarationType } from '../../../core/models/declaration.model';

describe('DeclarationFormComponent', () => {
  let component: DeclarationFormComponent;
  let fixture: ComponentFixture<DeclarationFormComponent>;
  let declarationServiceSpy: jasmine.SpyObj<DeclarationService>;
  let router: Router;

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

  function createComponent(paramMap: Record<string, string>, queryParamMap: Record<string, string> = {}) {
    declarationServiceSpy = jasmine.createSpyObj('DeclarationService', [
      'createPreliminary', 'createFinal', 'updateDeclaration', 'getDeclaration'
    ]);
    declarationServiceSpy.createPreliminary.and.returnValue(of(mockDeclaration));
    declarationServiceSpy.createFinal.and.returnValue(of(mockDeclaration));
    declarationServiceSpy.updateDeclaration.and.returnValue(of(mockDeclaration));
    declarationServiceSpy.getDeclaration.and.returnValue(of(mockDeclaration));

    TestBed.configureTestingModule({
      imports: [DeclarationFormComponent, ReactiveFormsModule, RouterModule.forRoot([]), TranslateModule.forRoot()],
      providers: [
        { provide: DeclarationService, useValue: declarationServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: (key: string) => paramMap[key] ?? null },
              queryParamMap: { get: (key: string) => queryParamMap[key] ?? null }
            }
          }
        }
      ]
    });

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(DeclarationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create in preliminary mode', () => {
    createComponent({ operationId: '1' }, { type: 'PRELIMINARY' });
    expect(component).toBeTruthy();
    expect(component.isEdit()).toBeFalse();
  });

  it('should submit preliminary declaration', () => {
    createComponent({ operationId: '1' }, { type: 'PRELIMINARY' });
    component.form.patchValue({
      declarationNumber: 'DECL-001', fobValue: 1000, cifValue: 1200,
      taxableBase: 1200, totalTaxes: 180, freightValue: 150, insuranceValue: 50,
      gattMethod: 'Method 1'
    });
    component.onSubmit();
    expect(declarationServiceSpy.createPreliminary).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalled();
  });

  it('should submit final declaration', () => {
    createComponent({ operationId: '1' }, { type: 'FINAL' });
    component.form.patchValue({
      declarationNumber: 'DECL-002', fobValue: 1000, cifValue: 1200,
      taxableBase: 1200, totalTaxes: 180, freightValue: 150, insuranceValue: 50,
      gattMethod: 'Method 1'
    });
    component.onSubmit();
    expect(declarationServiceSpy.createFinal).toHaveBeenCalled();
  });

  it('should not submit invalid form', () => {
    createComponent({ operationId: '1' }, { type: 'PRELIMINARY' });
    component.onSubmit();
    expect(declarationServiceSpy.createPreliminary).not.toHaveBeenCalled();
  });

  it('should load declaration in edit mode', () => {
    createComponent({ operationId: '1', declarationId: '1' });
    expect(component.isEdit()).toBeTrue();
    expect(declarationServiceSpy.getDeclaration).toHaveBeenCalledWith(1, 1);
  });
});
