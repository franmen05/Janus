import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { CrossingResultComponent } from './crossing-result.component';
import { DeclarationService } from '../../../core/services/declaration.service';
import { AuthService } from '../../../core/services/auth.service';
import { CrossingStatus } from '../../../core/models/declaration.model';

describe('CrossingResultComponent', () => {
  let component: CrossingResultComponent;
  let fixture: ComponentFixture<CrossingResultComponent>;
  let declarationServiceSpy: jasmine.SpyObj<DeclarationService>;

  const mockCrossing = {
    id: 1, operationId: 1, preliminaryDeclarationId: 1, finalDeclarationId: 2,
    status: CrossingStatus.MATCH, resolvedBy: null, resolutionComment: null,
    resolvedAt: null, discrepancies: [], createdAt: '2024-01-01T00:00:00'
  };

  beforeEach(async () => {
    declarationServiceSpy = jasmine.createSpyObj('DeclarationService', ['getCrossing', 'executeCrossing', 'resolveCrossing']);
    declarationServiceSpy.getCrossing.and.returnValue(of(mockCrossing));
    declarationServiceSpy.executeCrossing.and.returnValue(of(mockCrossing));
    declarationServiceSpy.resolveCrossing.and.returnValue(of(mockCrossing));

    const authServiceSpy = jasmine.createSpyObj('AuthService', ['hasRole']);
    authServiceSpy.hasRole.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [CrossingResultComponent, TranslateModule.forRoot(), FormsModule],
      providers: [
        { provide: DeclarationService, useValue: declarationServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(CrossingResultComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('operationId', 1);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load crossing on init', () => {
    expect(declarationServiceSpy.getCrossing).toHaveBeenCalledWith(1);
    expect(component.crossing()).toBeTruthy();
  });

  it('should execute crossing', () => {
    component.executeCrossing();
    expect(declarationServiceSpy.executeCrossing).toHaveBeenCalledWith(1);
  });

  it('should resolve crossing', () => {
    component.resolveComment = 'Resolved issue';
    component.resolveCrossing();
    expect(declarationServiceSpy.resolveCrossing).toHaveBeenCalledWith(1, { comment: 'Resolved issue' });
  });
});
