import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterModule, NavbarComponent, SidebarComponent],
  template: `
    <app-navbar />
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-2 p-0">
          <app-sidebar />
        </div>
        <div class="col-md-10 content-area">
          <router-outlet />
        </div>
      </div>
    </div>
  `
})
export class MainLayoutComponent {}
