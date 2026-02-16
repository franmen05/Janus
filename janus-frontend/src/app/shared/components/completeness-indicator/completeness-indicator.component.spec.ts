import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { CompletenessIndicatorComponent } from './completeness-indicator.component';

describe('CompletenessIndicatorComponent', () => {
  let component: CompletenessIndicatorComponent;
  let fixture: ComponentFixture<CompletenessIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompletenessIndicatorComponent, TranslateModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(CompletenessIndicatorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('percentage', 50);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show bg-danger for RED (default color)', () => {
    expect(component.progressClass()).toBe('bg-danger');
  });

  it('should show bg-success for GREEN', () => {
    fixture.componentRef.setInput('color', 'GREEN');
    fixture.detectChanges();
    expect(component.progressClass()).toBe('bg-success');
  });

  it('should show bg-warning text-dark for YELLOW', () => {
    fixture.componentRef.setInput('color', 'YELLOW');
    fixture.detectChanges();
    expect(component.progressClass()).toBe('bg-warning text-dark');
  });

  it('should display the correct percentage', () => {
    expect(component.percentage()).toBe(50);
  });

  it('should default to empty missing array', () => {
    expect(component.missing()).toEqual([]);
  });

  it('should accept missing documents', () => {
    fixture.componentRef.setInput('missing', ['BL', 'COMMERCIAL_INVOICE']);
    fixture.detectChanges();
    expect(component.missing().length).toBe(2);
  });
});
