import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { OperationService } from '../../core/services/operation.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { AlertService } from '../../core/services/alert.service';
import { AuthService } from '../../core/services/auth.service';
import { OperationStatus, TransportMode, OperationCategory, Operation } from '../../core/models/operation.model';
import { DashboardMetrics } from '../../core/models/dashboard.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let operationServiceSpy: jasmine.SpyObj<OperationService>;
  let dashboardServiceSpy: jasmine.SpyObj<DashboardService>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockOperations: Operation[] = [
    {
      id: 1, referenceNumber: 'OP-001', clientId: 1, clientName: 'Client A',
      transportMode: TransportMode.MARITIME, operationCategory: OperationCategory.CATEGORY_1,
      status: OperationStatus.DRAFT, assignedAgentId: null, assignedAgentName: null,
      blNumber: null, containerNumber: 'CONT-001', estimatedArrival: null, blOriginalAvailable: false,
      notes: null, deadline: null, closedAt: null, createdAt: '2024-01-01', updatedAt: '2024-01-01'
    },
    {
      id: 2, referenceNumber: 'OP-002', clientId: 2, clientName: 'Client B',
      transportMode: TransportMode.AIR, operationCategory: OperationCategory.CATEGORY_2,
      status: OperationStatus.CLOSED, assignedAgentId: null, assignedAgentName: null,
      blNumber: null, containerNumber: null, estimatedArrival: null, blOriginalAvailable: true,
      notes: null, deadline: null, closedAt: '2024-01-10', createdAt: '2024-01-02', updatedAt: '2024-01-10'
    },
    {
      id: 3, referenceNumber: 'OP-003', clientId: 1, clientName: 'Client A',
      transportMode: TransportMode.MARITIME, operationCategory: OperationCategory.CATEGORY_3,
      status: OperationStatus.CANCELLED, assignedAgentId: null, assignedAgentName: null,
      blNumber: null, containerNumber: null, estimatedArrival: null, blOriginalAvailable: false,
      notes: null, deadline: null, closedAt: null, createdAt: '2024-01-03', updatedAt: '2024-01-03'
    }
  ];

  const mockMetrics: DashboardMetrics = {
    operationsByStatus: { DRAFT: 1, CLOSED: 1, CANCELLED: 1 },
    overdueCount: 0,
    averageTimePerStage: { DRAFT: 24.5 },
    rejectionRate: 0.1,
    productivityByAgent: [
      { agentUsername: 'agent1', agentFullName: 'Agent One', operationsHandled: 5, operationsClosed: 3 }
    ]
  };

  beforeEach(async () => {
    operationServiceSpy = jasmine.createSpyObj('OperationService', ['getAll']);
    operationServiceSpy.getAll.and.returnValue(of(mockOperations));

    dashboardServiceSpy = jasmine.createSpyObj('DashboardService', ['getMetrics']);
    dashboardServiceSpy.getMetrics.and.returnValue(of(mockMetrics));

    alertServiceSpy = jasmine.createSpyObj('AlertService', ['getActiveAlerts']);
    alertServiceSpy.getActiveAlerts.and.returnValue(of([]));

    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasRole']);
    authServiceSpy.hasRole.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, RouterTestingModule, TranslateModule.forRoot(), FormsModule],
      providers: [
        { provide: OperationService, useValue: operationServiceSpy },
        { provide: DashboardService, useValue: dashboardServiceSpy },
        { provide: AlertService, useValue: alertServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load operations on init', () => {
    fixture.detectChanges();
    expect(operationServiceSpy.getAll).toHaveBeenCalled();
    expect(component.recentOperations().length).toBe(3);
  });

  it('should load metrics for admin/agent', () => {
    fixture.detectChanges();
    expect(dashboardServiceSpy.getMetrics).toHaveBeenCalled();
    expect(component.metrics()).toBeTruthy();
    expect(component.statusEntries().length).toBe(3);
  });

  it('should compute active and closed counts', () => {
    fixture.detectChanges();
    expect(component.closedCount()).toBe(1);
    expect(component.activeCount()).toBe(0);
  });

  it('should apply filters', () => {
    fixture.detectChanges();
    component.filterTransport = 'MARITIME';
    component.applyFilters();
    expect(dashboardServiceSpy.getMetrics).toHaveBeenCalledTimes(2);
  });
});
