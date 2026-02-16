import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AlertBadgeComponent } from './alert-badge.component';
import { AlertService } from '../../../core/services/alert.service';
import { AlertType, AlertStatus } from '../../../core/models/alert.model';

describe('AlertBadgeComponent', () => {
  let component: AlertBadgeComponent;
  let fixture: ComponentFixture<AlertBadgeComponent>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;

  beforeEach(async () => {
    alertServiceSpy = jasmine.createSpyObj('AlertService', ['getActiveAlerts']);
    alertServiceSpy.getActiveAlerts.and.returnValue(of([
      { id: 1, operationId: 1, operationRef: 'OP-001', alertType: AlertType.INACTIVITY_48H, status: AlertStatus.ACTIVE, message: 'Alert 1', acknowledgedBy: null, acknowledgedAt: null, createdAt: '2024-01-01' },
      { id: 2, operationId: 2, operationRef: 'OP-002', alertType: AlertType.DEADLINE_APPROACHING, status: AlertStatus.ACKNOWLEDGED, message: 'Alert 2', acknowledgedBy: 'admin', acknowledgedAt: '2024-01-02', createdAt: '2024-01-01' }
    ]));

    await TestBed.configureTestingModule({
      imports: [AlertBadgeComponent],
      providers: [
        { provide: AlertService, useValue: alertServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AlertBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show count of active alerts', () => {
    fixture.detectChanges();
    expect(component.count()).toBe(1);
  });

  it('should show badge when count > 0', () => {
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent.trim()).toBe('1');
  });
});
