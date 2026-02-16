import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AlertListComponent } from './alert-list.component';
import { AlertService } from '../../../core/services/alert.service';
import { AlertType, AlertStatus } from '../../../core/models/alert.model';

describe('AlertListComponent', () => {
  let component: AlertListComponent;
  let fixture: ComponentFixture<AlertListComponent>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;

  const mockAlerts = [
    { id: 1, operationId: 1, operationRef: 'OP-001', alertType: AlertType.INACTIVITY_48H, status: AlertStatus.ACTIVE, message: 'No activity', acknowledgedBy: null, acknowledgedAt: null, createdAt: '2024-01-01' },
    { id: 2, operationId: 2, operationRef: 'OP-002', alertType: AlertType.DEADLINE_APPROACHING, status: AlertStatus.ACKNOWLEDGED, message: 'Deadline soon', acknowledgedBy: 'admin', acknowledgedAt: '2024-01-02', createdAt: '2024-01-01' }
  ];

  beforeEach(async () => {
    alertServiceSpy = jasmine.createSpyObj('AlertService', ['getActiveAlerts', 'acknowledge']);
    alertServiceSpy.getActiveAlerts.and.returnValue(of(mockAlerts));
    alertServiceSpy.acknowledge.and.returnValue(of(mockAlerts[0]));

    await TestBed.configureTestingModule({
      imports: [AlertListComponent, RouterTestingModule, TranslateModule.forRoot()],
      providers: [
        { provide: AlertService, useValue: alertServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AlertListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load alerts on init', () => {
    expect(alertServiceSpy.getActiveAlerts).toHaveBeenCalled();
    expect(component.alerts().length).toBe(2);
  });

  it('should acknowledge an alert', () => {
    component.acknowledge(mockAlerts[0]);
    expect(alertServiceSpy.acknowledge).toHaveBeenCalledWith(1);
  });
});
