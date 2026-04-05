import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { SidebarService } from '../../core/services/sidebar.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterModule, NavbarComponent, SidebarComponent],
  template: `
    <app-navbar />
    <div class="layout-wrapper" [class.sidebar-collapsed]="sidebarService.collapsed()">
      <div class="d-none d-lg-block sidebar-wrapper">
        <app-sidebar />
      </div>
      <div class="content-area flex-grow-1">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .layout-wrapper {
      display: flex;
    }
    .sidebar-wrapper {
      width: 220px;
      min-width: 220px;
      transition: width 0.25s ease, min-width 0.25s ease;
    }
    .sidebar-collapsed .sidebar-wrapper {
      width: 68px;
      min-width: 68px;
    }
  `]
})
export class MainLayoutComponent {
  sidebarService = inject(SidebarService);
}
