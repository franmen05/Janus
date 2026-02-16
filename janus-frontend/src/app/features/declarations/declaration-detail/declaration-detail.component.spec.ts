import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { DeclarationDetailComponent } from './declaration-detail.component';
import { DeclarationService } from '../../../core/services/declaration.service';
import { AuthService } from '../../../core/services/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DeclarationType } from '../../../core/models/declaration.model';

describe('DeclarationDetailComponent', () => {
  let component: DeclarationDetailComponent;
  let fixture: ComponentFixture<DeclarationDetailComponent>;

  beforeEach(async () => {
    const declarationServiceSpy = jasmine.createSpyObj('DeclarationService', ['getDeclaration', 'getTariffLines']);
    declarationServiceSpy.getDeclaration.and.returnValue(of({
      id: 1, operationId: 1, declarationType: DeclarationType.PRELIMINARY,
      declarationNumber: 'DECL-001', fobValue: 1000, cifValue: 1200,
      taxableBase: 1200, totalTaxes: 180, freightValue: 150, insuranceValue: 50,
      gattMethod: 'Method 1', notes: null, submittedAt: null, createdAt: '2024-01-01T00:00:00'
    }));
    declarationServiceSpy.getTariffLines.and.returnValue(of([]));

    const authServiceSpy = jasmine.createSpyObj('AuthService', ['hasRole']);
    authServiceSpy.hasRole.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [DeclarationDetailComponent, TranslateModule.forRoot()],
      providers: [
        { provide: DeclarationService, useValue: declarationServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NgbModal, useValue: jasmine.createSpyObj('NgbModal', ['open']) },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ operationId: '1', declarationId: '1' }) } } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(DeclarationDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load declaration on init', () => {
    expect(component.declaration()).toBeTruthy();
    expect(component.declaration()!.declarationNumber).toBe('DECL-001');
  });
});
