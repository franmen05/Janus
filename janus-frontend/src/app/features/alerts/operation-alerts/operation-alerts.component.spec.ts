import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { OperationAlertsComponent } from './operation-alerts.component';
import { AlertService } from '../../../core/services/alert.service';
import { AlertType, AlertStatus } from '../../../core/models/alert.model';

describe('OperationAlertsComponent', () => {
  let component: OperationAlertsComponent;
  let fixture: ComponentFixture<OperationAlertsComponent>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;

  const mockAlerts = [
    { id: 1, operationId: 1, operationRef: 'OP-001', alertType: AlertType.INACTIVITY_48H, status: AlertStatus.ACTIVE, message: 'No activity for 48h', acknowledgedBy: null, acknowledgedAt: null, createdAt: '2024-01-01' }
  ];

  beforeEach(async () => {
    alertServiceSpy = jasmine.createSpyObj('AlertService', ['getByOperation', 'acknowledge']);
    alertServiceSpy.getByOperation.and.returnValue(of(mockAlerts));
    alertServiceSpy.acknowledge.and.returnValue(of(mockAlerts[0]));

    await TestBed.configureTestingModule({
      imports: [OperationAlertsComponent, TranslateModule.forRoot()],
      providers: [
        { provide: AlertService, useValue: alertServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OperationAlertsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('operationId', 1);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load active alerts for operation', () => {
    expect(alertServiceSpy.getByOperation).toHaveBeenCalledWith(1);
    expect(component.activeAlerts().length).toBe(1);
  });

  it('should acknowledge an alert', () => {
    component.acknowledge(mockAlerts[0]);
    expect(alertServiceSpy.acknowledge).toHaveBeenCalledWith(1);
  });
});
