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

  describe('insurance calculation', () => {
    beforeEach(() => {
      createComponent({ operationId: '1' }, { type: 'PRELIMINARY' });
    });

    it('should auto-calculate insurance from FOB and percentage', () => {
      component.form.get('fobValue')!.setValue(1000);
      expect(component.form.get('insuranceValue')!.value).toBe(20); // 2% of 1000
    });

    it('should recalculate insurance when percentage changes', () => {
      component.form.get('fobValue')!.setValue(1000);
      component.form.get('insurancePercentage')!.setValue(5);
      expect(component.form.get('insuranceValue')!.value).toBe(50); // 5% of 1000
    });

    it('should NOT overwrite manual insurance when FOB changes', () => {
      component.form.get('fobValue')!.setValue(1000); // insurance = 20
      component.form.get('insuranceValue')!.setValue(99); // manual override
      component.form.get('fobValue')!.setValue(2000); // should NOT overwrite 99
      expect(component.form.get('insuranceValue')!.value).toBe(99);
    });

    it('should recalculate CIF with manual insurance', () => {
      component.form.get('fobValue')!.setValue(1000);
      component.form.get('freightValue')!.setValue(100);
      component.form.get('insuranceValue')!.setValue(50); // manual
      expect(component.form.get('cifValue')!.value).toBe(1150); // 1000 + 100 + 50
    });

    it('should resume auto-calc when percentage changes after manual edit', () => {
      component.form.get('fobValue')!.setValue(1000);
      component.form.get('insuranceValue')!.setValue(99); // manual
      component.form.get('insurancePercentage')!.setValue(3); // should reset manual flag
      expect(component.form.get('insuranceValue')!.value).toBe(30); // 3% of 1000
    });
  });

  describe('insurance in edit mode', () => {
    it('should preserve saved insurance value on load', () => {
      // mockDeclaration has fobValue=1000, insuranceValue=50
      createComponent({ operationId: '1', declarationId: '1' });
      expect(component.form.get('insuranceValue')!.value).toBe(50);
      expect(component.form.get('fobValue')!.value).toBe(1000);
    });
  });
});
