import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { OperationTimelineComponent } from './operation-timeline.component';
import { TimelineService } from '../../../core/services/timeline.service';
import { TimelineEventType } from '../../../core/models/timeline.model';

describe('OperationTimelineComponent', () => {
  let component: OperationTimelineComponent;
  let fixture: ComponentFixture<OperationTimelineComponent>;
  let timelineServiceSpy: jasmine.SpyObj<TimelineService>;

  beforeEach(async () => {
    timelineServiceSpy = jasmine.createSpyObj('TimelineService', ['getTimeline']);
    timelineServiceSpy.getTimeline.and.returnValue(of([
      { eventType: TimelineEventType.STATUS_CHANGE, description: 'Status changed', username: 'admin',
        timestamp: '2024-01-01T00:00:00', previousStatus: null, newStatus: 'DRAFT', metadata: {} }
    ]));

    await TestBed.configureTestingModule({
      imports: [OperationTimelineComponent, TranslateModule.forRoot(), FormsModule],
      providers: [{ provide: TimelineService, useValue: timelineServiceSpy }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(OperationTimelineComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('operationId', 1);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load timeline on init', () => {
    expect(timelineServiceSpy.getTimeline).toHaveBeenCalledWith(1, undefined);
    expect(component.timelineEvents().length).toBe(1);
  });

  it('should filter by event type', () => {
    component.selectedType = 'COMMENT';
    component.loadTimeline();
    expect(timelineServiceSpy.getTimeline).toHaveBeenCalledWith(1, TimelineEventType.COMMENT);
  });
});
