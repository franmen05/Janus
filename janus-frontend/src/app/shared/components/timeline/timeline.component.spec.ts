import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { TimelineComponent, TimelineEvent } from './timeline.component';

describe('TimelineComponent', () => {
  let component: TimelineComponent;
  let fixture: ComponentFixture<TimelineComponent>;

  const mockEvents: TimelineEvent[] = [
    { title: 'Operation Created', description: 'Draft operation created', date: '2026-01-15T10:00:00', user: 'admin' },
    { title: 'Status Changed', description: 'Changed to Documentation Complete', date: '2026-01-16T14:30:00' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimelineComponent, TranslateModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(TimelineComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('events', mockEvents);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display timeline items', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('.d-flex.mb-3');
    expect(items.length).toBe(2);
  });

  it('should display event titles', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const titles = compiled.querySelectorAll('strong');
    expect(titles[0].textContent).toContain('Operation Created');
    expect(titles[1].textContent).toContain('Status Changed');
  });

  it('should display empty state when no items', () => {
    fixture.componentRef.setInput('events', []);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('.d-flex.mb-3');
    expect(items.length).toBe(0);
  });

  it('should display user name when present', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.textContent;
    expect(text).toContain('admin');
  });
});
