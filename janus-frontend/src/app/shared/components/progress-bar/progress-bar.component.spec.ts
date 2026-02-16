import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { ProgressBarComponent } from './progress-bar.component';

describe('ProgressBarComponent', () => {
  let component: ProgressBarComponent;
  let fixture: ComponentFixture<ProgressBarComponent>;

  const mockTranslateService = {
    instant: (key: string) => key
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressBarComponent],
      providers: [
        { provide: TranslateService, useValue: mockTranslateService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressBarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('status', 'DRAFT');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have currentIndex 0 for DRAFT', () => {
    expect(component.currentIndex()).toBe(0);
  });

  it('should calculate progressPercent as 12.5 for DRAFT (1/8 * 100)', () => {
    expect(component.progressPercent()).toBe(12.5);
  });

  it('should have isFinal true for CLOSED', () => {
    fixture.componentRef.setInput('status', 'CLOSED');
    fixture.detectChanges();
    expect(component.isFinal()).toBeTrue();
  });

  it('should have isFinal true for CANCELLED', () => {
    fixture.componentRef.setInput('status', 'CANCELLED');
    fixture.detectChanges();
    expect(component.isFinal()).toBeTrue();
  });

  it('should have isFinal false for DRAFT', () => {
    expect(component.isFinal()).toBeFalse();
  });

  it('should calculate progressPercent as 100 for CLOSED (8/8 * 100)', () => {
    fixture.componentRef.setInput('status', 'CLOSED');
    fixture.detectChanges();
    expect(component.progressPercent()).toBe(100);
  });
});
