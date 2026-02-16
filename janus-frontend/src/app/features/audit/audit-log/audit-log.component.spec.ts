import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AuditLogComponent } from './audit-log.component';
import { AuditService } from '../../../core/services/audit.service';
import { AuditLog } from '../../../core/models/audit.model';

describe('AuditLogComponent', () => {
  let component: AuditLogComponent;
  let fixture: ComponentFixture<AuditLogComponent>;
  let auditServiceSpy: jasmine.SpyObj<AuditService>;

  const mockLogs: AuditLog[] = [
    {
      id: 1, action: 'CREATE', entityName: 'Operation', entityId: 1,
      username: 'admin', details: 'Created operation OP-001',
      ipAddress: '127.0.0.1', createdAt: '2024-01-01T10:00:00'
    } as AuditLog,
    {
      id: 2, action: 'STATUS_CHANGE', entityName: 'Operation', entityId: 1,
      username: 'agent1', details: 'Changed status to DRAFT',
      ipAddress: '192.168.1.1', createdAt: '2024-01-02T10:00:00'
    } as AuditLog
  ];

  beforeEach(async () => {
    auditServiceSpy = jasmine.createSpyObj('AuditService', ['getAll']);
    auditServiceSpy.getAll.and.returnValue(of(mockLogs));

    await TestBed.configureTestingModule({
      imports: [AuditLogComponent, FormsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuditService, useValue: auditServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AuditLogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load audit logs on init', () => {
    fixture.detectChanges();
    expect(auditServiceSpy.getAll).toHaveBeenCalled();
    expect(component.logs().length).toBe(2);
  });

  it('should filter by username', () => {
    fixture.detectChanges();
    component.filterUsername = 'admin';
    component.loadLogs();
    expect(auditServiceSpy.getAll).toHaveBeenCalledWith('admin');
  });
});
