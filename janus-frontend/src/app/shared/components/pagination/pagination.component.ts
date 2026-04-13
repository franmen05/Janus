import { Component, input, output } from '@angular/core';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [NgbPaginationModule, TranslateModule],
  template: `
    @if (totalPages() > 1) {
      <div class="d-flex justify-content-between align-items-center mt-3 px-3 pb-3">
        <small class="text-body-secondary">
          {{ 'PAGINATION.SHOWING' | translate:{ from: from(), to: to(), total: totalElements() } }}
        </small>
        <ngb-pagination
          [collectionSize]="totalElements()"
          [page]="currentPage()"
          [pageSize]="pageSize()"
          [maxSize]="5"
          [rotate]="true"
          [boundaryLinks]="true"
          (pageChange)="onPageChange($event)"
          size="sm">
        </ngb-pagination>
      </div>
    }
  `
})
export class PaginationComponent {
  currentPage = input.required<number>();
  pageSize = input.required<number>();
  totalElements = input.required<number>();
  totalPages = input.required<number>();
  pageChange = output<number>();

  from(): number {
    return ((this.currentPage() - 1) * this.pageSize()) + 1;
  }

  to(): number {
    return Math.min(this.currentPage() * this.pageSize(), this.totalElements());
  }

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }
}
