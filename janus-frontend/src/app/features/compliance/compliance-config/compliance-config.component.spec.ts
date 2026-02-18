import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { ComplianceConfigComponent } from './compliance-config.component';
import { ComplianceRuleConfigService } from '../../../core/services/compliance-rule-config.service';
import { ComplianceRuleConfig } from '../../../core/models/compliance-rule-config.model';

describe('ComplianceConfigComponent', () => {
  let component: ComplianceConfigComponent;
  let fixture: ComponentFixture<ComplianceConfigComponent>;
  let configServiceSpy: jasmine.SpyObj<ComplianceRuleConfigService>;
  let translateServiceSpy: jasmine.SpyObj<TranslateService>;

  const mockRules: ComplianceRuleConfig[] = [
    { id: 1, ruleCode: 'COMPLETENESS_REQUIRED', paramKey: 'threshold', paramValue: '100', enabled: true, description: 'All documents required' },
    { id: 2, ruleCode: 'HIGH_VALUE_ADDITIONAL_DOC', paramKey: 'minValue', paramValue: '50000', enabled: false, description: 'Extra docs for high value' }
  ];

  beforeEach(async () => {
    configServiceSpy = jasmine.createSpyObj('ComplianceRuleConfigService', ['getAll', 'update', 'create', 'delete']);
    configServiceSpy.getAll.and.returnValue(of(mockRules));
    configServiceSpy.update.and.returnValue(of(mockRules[0]));
    configServiceSpy.create.and.returnValue(of(mockRules[0]));
    configServiceSpy.delete.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [ComplianceConfigComponent, FormsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ComplianceRuleConfigService, useValue: configServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ComplianceConfigComponent);
    component = fixture.componentInstance;
    translateServiceSpy = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load rules on init', () => {
    fixture.detectChanges();
    expect(configServiceSpy.getAll).toHaveBeenCalled();
    expect(component.rules().length).toBe(2);
    expect(component.loading()).toBeFalse();
  });

  it('should set error flag when loading rules fails', () => {
    configServiceSpy.getAll.and.returnValue(throwError(() => new Error('Server error')));
    fixture.detectChanges();
    expect(component.error()).toBeTrue();
    expect(component.loading()).toBeFalse();
  });

  describe('toggleEnabled', () => {
    it('should call update service with toggled enabled value', () => {
      fixture.detectChanges();
      const rule = mockRules[0];
      component.toggleEnabled(rule);
      expect(configServiceSpy.update).toHaveBeenCalledWith(rule.id, {
        paramValue: rule.paramValue,
        enabled: !rule.enabled,
        description: rule.description
      });
    });

    it('should set error flag when toggle fails', () => {
      configServiceSpy.update.and.returnValue(throwError(() => new Error('Server error')));
      fixture.detectChanges();
      component.toggleEnabled(mockRules[0]);
      expect(component.error()).toBeTrue();
    });
  });

  describe('deleteRule', () => {
    it('should call delete service after confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      fixture.detectChanges();
      component.deleteRule(mockRules[0]);
      expect(configServiceSpy.delete).toHaveBeenCalledWith(1);
    });

    it('should not call delete service when confirmation is cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      fixture.detectChanges();
      component.deleteRule(mockRules[0]);
      expect(configServiceSpy.delete).not.toHaveBeenCalled();
    });

    it('should reload rules after successful delete', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      fixture.detectChanges();
      configServiceSpy.getAll.calls.reset();
      component.deleteRule(mockRules[0]);
      expect(configServiceSpy.getAll).toHaveBeenCalled();
    });

    it('should set success message after delete', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      fixture.detectChanges();
      component.deleteRule(mockRules[0]);
      expect(component.successMessage()).toBe('COMPLIANCE_CONFIG.DELETED');
    });
  });

  describe('submitCreate', () => {
    it('should call create service with new rule data', () => {
      fixture.detectChanges();
      const newRule = {
        ruleCode: 'RESTRICTED_COUNTRY',
        paramKey: 'countryCode',
        paramValue: 'NK',
        description: 'Restricted country',
        enabled: true
      };
      component.newRule = { ...newRule };
      component.submitCreate();
      expect(configServiceSpy.create).toHaveBeenCalledWith(jasmine.objectContaining(newRule));
    });

    it('should hide form and reload rules after successful create', () => {
      fixture.detectChanges();
      component.showCreateForm.set(true);
      component.newRule = { ruleCode: 'RESTRICTED_COUNTRY', paramKey: 'countryCode', paramValue: 'NK', enabled: true };
      configServiceSpy.getAll.calls.reset();
      component.submitCreate();
      expect(component.showCreateForm()).toBeFalse();
      expect(configServiceSpy.getAll).toHaveBeenCalled();
      expect(component.successMessage()).toBe('COMPLIANCE_CONFIG.CREATED');
    });

    it('should set error flag when create fails', () => {
      configServiceSpy.create.and.returnValue(throwError(() => new Error('Server error')));
      fixture.detectChanges();
      component.submitCreate();
      expect(component.error()).toBeTrue();
    });
  });

  describe('getTransition', () => {
    it('should return correct translation key for known rules', () => {
      expect(component.getTransition('COMPLETENESS_REQUIRED')).toBe('COMPLIANCE_CONFIG.TRANSITION.COMPLETENESS_REQUIRED');
      expect(component.getTransition('HIGH_VALUE_ADDITIONAL_DOC')).toBe('COMPLIANCE_CONFIG.TRANSITION.HIGH_VALUE_ADDITIONAL_DOC');
      expect(component.getTransition('RESTRICTED_COUNTRY')).toBe('COMPLIANCE_CONFIG.TRANSITION.RESTRICTED_COUNTRY');
      expect(component.getTransition('COMMERCIAL_INVOICE_REQUIRED')).toBe('COMPLIANCE_CONFIG.TRANSITION.COMMERCIAL_INVOICE_REQUIRED');
      expect(component.getTransition('BL_VERIFIED_FOR_VALUATION')).toBe('COMPLIANCE_CONFIG.TRANSITION.BL_VERIFIED_FOR_VALUATION');
      expect(component.getTransition('PHYSICAL_INSPECTION_GATT')).toBe('COMPLIANCE_CONFIG.TRANSITION.PHYSICAL_INSPECTION_GATT');
      expect(component.getTransition('CROSSING_RESOLVED')).toBe('COMPLIANCE_CONFIG.TRANSITION.CROSSING_RESOLVED');
    });

    it('should return UNKNOWN key for unknown rules', () => {
      expect(component.getTransition('NON_EXISTENT_RULE')).toBe('COMPLIANCE_CONFIG.TRANSITION.UNKNOWN');
      expect(component.getTransition('')).toBe('COMPLIANCE_CONFIG.TRANSITION.UNKNOWN');
    });
  });

  describe('toggleCreateForm', () => {
    it('should toggle the create form visibility', () => {
      fixture.detectChanges();
      expect(component.showCreateForm()).toBeFalse();
      component.toggleCreateForm();
      expect(component.showCreateForm()).toBeTrue();
      component.toggleCreateForm();
      expect(component.showCreateForm()).toBeFalse();
    });

    it('should reset new rule when opening form', () => {
      fixture.detectChanges();
      component.newRule = { ruleCode: 'SOME_CODE', paramKey: 'key', paramValue: 'val', enabled: false };
      component.toggleCreateForm();
      expect(component.newRule.ruleCode).toBe('');
      expect(component.newRule.enabled).toBeTrue();
    });
  });

  describe('edit functionality', () => {
    it('should start editing a rule', () => {
      fixture.detectChanges();
      component.startEdit(mockRules[0]);
      expect(component.editingId()).toBe(1);
      expect(component.editValue).toBe('100');
    });

    it('should cancel editing', () => {
      fixture.detectChanges();
      component.startEdit(mockRules[0]);
      component.cancelEdit();
      expect(component.editingId()).toBeNull();
      expect(component.editValue).toBe('');
    });

    it('should save edit and call update service', () => {
      fixture.detectChanges();
      component.startEdit(mockRules[0]);
      component.editValue = '200';
      component.saveEdit(mockRules[0]);
      expect(configServiceSpy.update).toHaveBeenCalledWith(1, {
        paramValue: '200',
        enabled: true,
        description: 'All documents required'
      });
    });

    it('should reset editing state after successful save', () => {
      fixture.detectChanges();
      configServiceSpy.getAll.calls.reset();
      component.startEdit(mockRules[0]);
      component.editValue = '200';
      component.saveEdit(mockRules[0]);
      expect(component.editingId()).toBeNull();
      expect(component.editValue).toBe('');
      expect(configServiceSpy.getAll).toHaveBeenCalled();
      expect(component.successMessage()).toBe('COMPLIANCE_CONFIG.UPDATED');
    });
  });
});
