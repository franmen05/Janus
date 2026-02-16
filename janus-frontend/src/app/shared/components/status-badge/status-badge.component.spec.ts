import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let component: StatusBadgeComponent;
  let fixture: ComponentFixture<StatusBadgeComponent>;

  const mockTranslateService = {
    instant: (key: string) => key
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
      providers: [
        { provide: TranslateService, useValue: mockTranslateService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('status', 'DRAFT');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show correct badge class for DRAFT', () => {
    expect(component.getBadgeClass()).toBe('bg-secondary');
  });

  it('should show correct badge class for CLOSED', () => {
    fixture.componentRef.setInput('status', 'CLOSED');
    fixture.detectChanges();
    expect(component.getBadgeClass()).toBe('bg-success');
  });

  it('should show correct badge class for CANCELLED', () => {
    fixture.componentRef.setInput('status', 'CANCELLED');
    fixture.detectChanges();
    expect(component.getBadgeClass()).toBe('bg-danger');
  });

  it('should default to bg-secondary for unknown status', () => {
    fixture.componentRef.setInput('status', 'UNKNOWN');
    fixture.detectChanges();
    expect(component.getBadgeClass()).toBe('bg-secondary');
  });

  it('should return status value as label when translation key equals key', () => {
    fixture.componentRef.setInput('status', 'DRAFT');
    fixture.detectChanges();
    expect(component.getLabel()).toBe('DRAFT');
  });
});
