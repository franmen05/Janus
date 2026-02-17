import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'operations',
        loadComponent: () => import('./features/operations/operation-list/operation-list.component').then(m => m.OperationListComponent)
      },
      {
        path: 'operations/new',
        loadComponent: () => import('./features/operations/operation-form/operation-form.component').then(m => m.OperationFormComponent),
        data: { roles: ['ADMIN', 'AGENT'] },
        canActivate: [roleGuard]
      },
      {
        path: 'operations/:id',
        loadComponent: () => import('./features/operations/operation-detail/operation-detail.component').then(m => m.OperationDetailComponent)
      },
      {
        path: 'operations/:id/edit',
        loadComponent: () => import('./features/operations/operation-form/operation-form.component').then(m => m.OperationFormComponent),
        data: { roles: ['ADMIN', 'AGENT'] },
        canActivate: [roleGuard]
      },
      {
        path: 'operations/:operationId/declarations/:declarationId',
        loadComponent: () => import('./features/declarations/declaration-detail/declaration-detail.component').then(m => m.DeclarationDetailComponent),
        data: { roles: ['ADMIN', 'AGENT', 'ACCOUNTING'] },
        canActivate: [roleGuard]
      },
      {
        path: 'operations/:id/documents/upload',
        loadComponent: () => import('./features/documents/document-upload/document-upload.component').then(m => m.DocumentUploadComponent),
        data: { roles: ['ADMIN', 'AGENT'] },
        canActivate: [roleGuard]
      },
      {
        path: 'operations/:operationId/documents/:documentId/versions',
        loadComponent: () => import('./features/documents/document-versions/document-versions.component').then(m => m.DocumentVersionsComponent),
        data: { roles: ['ADMIN', 'AGENT', 'ACCOUNTING', 'CLIENT'] },
        canActivate: [roleGuard]
      },
      {
        path: 'clients',
        loadComponent: () => import('./features/clients/client-list/client-list.component').then(m => m.ClientListComponent),
        data: { roles: ['ADMIN', 'AGENT'] },
        canActivate: [roleGuard]
      },
      {
        path: 'clients/new',
        loadComponent: () => import('./features/clients/client-form/client-form.component').then(m => m.ClientFormComponent),
        data: { roles: ['ADMIN'] },
        canActivate: [roleGuard]
      },
      {
        path: 'clients/:id/edit',
        loadComponent: () => import('./features/clients/client-form/client-form.component').then(m => m.ClientFormComponent),
        data: { roles: ['ADMIN'] },
        canActivate: [roleGuard]
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/user-list/user-list.component').then(m => m.UserListComponent),
        data: { roles: ['ADMIN'] },
        canActivate: [roleGuard]
      },
      {
        path: 'users/new',
        loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent),
        data: { roles: ['ADMIN'] },
        canActivate: [roleGuard]
      },
      {
        path: 'users/:id/edit',
        loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent),
        data: { roles: ['ADMIN'] },
        canActivate: [roleGuard]
      },
      {
        path: 'alerts',
        loadComponent: () => import('./features/alerts/alert-list/alert-list.component').then(m => m.AlertListComponent),
        data: { roles: ['ADMIN', 'AGENT'] },
        canActivate: [roleGuard]
      },
      {
        path: 'audit',
        loadComponent: () => import('./features/audit/audit-log/audit-log.component').then(m => m.AuditLogComponent),
        data: { roles: ['ADMIN'] },
        canActivate: [roleGuard]
      },
      {
        path: 'compliance-config',
        loadComponent: () => import('./features/compliance/compliance-config/compliance-config.component').then(m => m.ComplianceConfigComponent),
        data: { roles: ['ADMIN'] },
        canActivate: [roleGuard]
      }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
