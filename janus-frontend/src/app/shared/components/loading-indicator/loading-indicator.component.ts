import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-loading-indicator',
  standalone: true,
  imports: [TranslateModule],
  template: `
    <div class="d-flex flex-column align-items-center justify-content-center py-5">
      <div class="loading-icon mb-3" [class.loading-icon-sm]="size() === 'sm'">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <!-- Truck body -->
          <rect x="30" y="45" width="55" height="25" rx="2" class="truck-body"/>
          <!-- Truck cabin -->
          <path d="M85 50 L95 50 Q100 50 100 55 L100 70 L85 70 Z" class="truck-body"/>
          <!-- Cabin window -->
          <rect x="88" y="53" width="9" height="8" rx="1" class="truck-window"/>
          <!-- Wheels -->
          <circle cx="48" cy="74" r="6" class="truck-wheel"/>
          <circle cx="48" cy="74" r="2.5" class="truck-wheel-inner"/>
          <circle cx="88" cy="74" r="6" class="truck-wheel"/>
          <circle cx="88" cy="74" r="2.5" class="truck-wheel-inner"/>
          <!-- Axle line -->
          <line x1="30" y1="70" x2="100" y2="70"/>
          <!-- Package 1 (on truck) -->
          <rect x="36" y="32" width="16" height="13" rx="1" class="package"/>
          <line x1="44" y1="32" x2="44" y2="45"/>
          <path d="M40 36 L44 33 L48 36" class="package-tape"/>
          <!-- Package 2 (being loaded - animated) -->
          <g class="loading-package">
            <rect x="56" y="25" width="14" height="12" rx="1" class="package"/>
            <line x1="63" y1="25" x2="63" y2="37"/>
            <path d="M59 29 L63 26 L67 29" class="package-tape"/>
          </g>
          <!-- Crane arm -->
          <g class="crane-arm">
            <line x1="20" y1="15" x2="20" y2="70"/>
            <line x1="18" y1="15" x2="63" y2="15"/>
            <line x1="63" y1="15" x2="63" y2="22"/>
            <!-- Crane hook -->
            <circle cx="63" cy="22" r="2"/>
            <!-- Crane base -->
            <circle cx="20" cy="13" r="3"/>
            <!-- Support cable -->
            <line x1="20" y1="15" x2="40" y2="45" stroke-dasharray="3 2" opacity="0.4"/>
          </g>
        </svg>
      </div>
      <span class="loading-text text-muted">{{ message() | translate }}</span>
    </div>
  `,
  styles: [`
    .loading-icon {
      width: 100px;
      height: 84px;
      color: var(--bs-primary);
      opacity: 0.7;
      animation: truckBounce 2s ease-in-out infinite;
    }
    .loading-icon-sm {
      width: 64px;
      height: 54px;
    }
    .loading-icon svg {
      width: 100%;
      height: 100%;
    }
    .truck-body {
      fill: none;
    }
    .truck-window {
      fill: var(--bs-primary);
      opacity: 0.15;
      stroke: currentColor;
    }
    .truck-wheel {
      fill: none;
    }
    .truck-wheel-inner {
      fill: currentColor;
      stroke: none;
      opacity: 0.3;
    }
    .package {
      fill: var(--bs-primary);
      opacity: 0.1;
    }
    .package-tape {
      fill: none;
    }
    .loading-package {
      animation: packageLoad 2s ease-in-out infinite;
    }
    .crane-arm {
      transform-origin: 20px 15px;
      animation: craneSway 2s ease-in-out infinite;
    }
    .loading-text {
      font-size: 0.85rem;
      letter-spacing: 0.03em;
    }
    @keyframes truckBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }
    @keyframes packageLoad {
      0%, 100% { transform: translateY(0); opacity: 1; }
      50% { transform: translateY(-6px); opacity: 0.7; }
    }
    @keyframes craneSway {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(1.5deg); }
    }
  `]
})
export class LoadingIndicatorComponent {
  message = input('COMMON.LOADING');
  size = input<'md' | 'sm'>('md');
}
