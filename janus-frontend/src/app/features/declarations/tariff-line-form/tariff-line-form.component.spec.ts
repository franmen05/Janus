import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import { TariffLineFormComponent } from './tariff-line-form.component';
import { DeclarationService } from '../../../core/services/declaration.service';

describe('TariffLineFormComponent', () => {
  let component: TariffLineFormComponent;
  let fixture: ComponentFixture<TariffLineFormComponent>;
  let declarationServiceSpy: jasmine.SpyObj<DeclarationService>;

  beforeEach(async () => {
    declarationServiceSpy = jasmine.createSpyObj('DeclarationService', ['addTariffLine']);
    declarationServiceSpy.addTariffLine.and.returnValue(of({
      id: 1, declarationId: 1, lineNumber: 1, tariffCode: '8471.30',
      description: 'Test', quantity: 10, unitValue: 100, totalValue: 1000,
      taxRate: 15, taxAmount: 150
    }));

    await TestBed.configureTestingModule({
      imports: [TariffLineFormComponent, ReactiveFormsModule, TranslateModule.forRoot()],
      providers: [
        { provide: DeclarationService, useValue: declarationServiceSpy },
        { provide: NgbActiveModal, useValue: jasmine.createSpyObj('NgbActiveModal', ['close', 'dismiss']) }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TariffLineFormComponent);
    component = fixture.componentInstance;
    component.operationId = 1;
    component.declarationId = 1;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should submit tariff line', () => {
    component.form.patchValue({
      lineNumber: 1, tariffCode: '8471.30', quantity: 10,
      unitValue: 100, totalValue: 1000, taxRate: 15, taxAmount: 150
    });
    component.onSubmit();
    expect(declarationServiceSpy.addTariffLine).toHaveBeenCalled();
  });
});
