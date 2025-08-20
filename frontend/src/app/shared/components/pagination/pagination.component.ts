import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pagination" *ngIf="pagination && pagination.totalPages > 1">
      <button 
        class="page-btn first-btn"
        [disabled]="!pagination.hasPrevPage"
        (click)="goToPage(1)"
        title="First page"
        *ngIf="showFirstLast">
        <i class="fas fa-angle-double-left"></i>
      </button>
      
      <button 
        class="page-btn prev-btn"
        [disabled]="!pagination.hasPrevPage"
        (click)="goToPage(pagination.currentPage - 1)"
        title="Previous page">
        <i class="fas fa-chevron-left"></i>
      </button>
      
      <div class="page-numbers" *ngIf="showPageNumbers">
        <button 
          *ngFor="let page of visiblePages"
          class="page-btn page-number"
          [class.active]="page === pagination.currentPage"
          [disabled]="page === '...'"
          (click)="page !== '...' && goToPage(+page)"
          [title]="'Go to page ' + page">
          {{ page }}
        </button>
      </div>
      
      <span class="page-info" *ngIf="!showPageNumbers">
        {{ pagination.currentPage }} / {{ pagination.totalPages }}
      </span>
      
      <button 
        class="page-btn next-btn"
        [disabled]="!pagination.hasNextPage"
        (click)="goToPage(pagination.currentPage + 1)"
        title="Next page">
        <i class="fas fa-chevron-right"></i>
      </button>
      
      <button 
        class="page-btn last-btn"
        [disabled]="!pagination.hasNextPage"
        (click)="goToPage(pagination.totalPages)"
        title="Last page"
        *ngIf="showFirstLast">
        <i class="fas fa-angle-double-right"></i>
      </button>
      
      <div class="page-size" *ngIf="showPageSize">
        <select [value]="pageSize" (change)="onPageSizeChange($event)" class="page-size-select">
          <option *ngFor="let size of pageSizeOptions" [value]="size">
            {{ size }} per page
          </option>
        </select>
      </div>
      
      <div class="total-count" *ngIf="showTotalCount">
        Total: {{ pagination.totalCount }} items
      </div>
    </div>
  `,
  styles: [`
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 16px 20px;
      border-top: 1px solid #2b374a;
      background: #232e3c;
      flex-wrap: wrap;
    }

    .page-btn {
      background: #17212b;
      border: 1px solid #2b374a;
      color: #8696a8;
      width: 36px;
      height: 36px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      transition: all 0.2s;
    }

    .page-btn:hover:not(:disabled) {
      background: #2b374a;
      color: #ffffff;
      border-color: #5288c1;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-btn.active {
      background: #5288c1;
      color: white;
      border-color: #5288c1;
    }

    .page-numbers {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .page-number {
      min-width: 36px;
    }

    .page-info {
      color: #8696a8;
      font-size: 14px;
      margin: 0 8px;
      white-space: nowrap;
    }

    .page-size {
      margin-left: auto;
    }

    .page-size-select {
      background: #17212b;
      border: 1px solid #2b374a;
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
    }

    .page-size-select:focus {
      outline: none;
      border-color: #5288c1;
    }

    .total-count {
      color: #8696a8;
      font-size: 12px;
      white-space: nowrap;
    }

    @media (max-width: 768px) {
      .pagination {
        flex-direction: column;
        gap: 12px;
      }

      .page-numbers {
        order: -1;
      }

      .page-size,
      .total-count {
        margin-left: 0;
      }
    }

    @media (max-width: 480px) {
      .page-btn {
        width: 32px;
        height: 32px;
        font-size: 12px;
      }

      .first-btn,
      .last-btn {
        display: none;
      }
    }
  `]
})
export class PaginationComponent {
  @Input() pagination: PaginationInfo | null = null;
  @Input() showPageNumbers = false;
  @Input() showFirstLast = false;
  @Input() showPageSize = false;
  @Input() showTotalCount = false;
  @Input() pageSize = 20;
  @Input() pageSizeOptions = [10, 20, 50, 100];
  @Input() maxVisiblePages = 5;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get visiblePages(): (number | string)[] {
    if (!this.pagination || !this.showPageNumbers) return [];

    const { currentPage, totalPages } = this.pagination;
    const pages: (number | string)[] = [];
    
    if (totalPages <= this.maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with ellipsis
      const startPage = Math.max(1, currentPage - Math.floor(this.maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + this.maxVisiblePages - 1);
      
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  }

  goToPage(page: number): void {
    if (this.pagination && page >= 1 && page <= this.pagination.totalPages && page !== this.pagination.currentPage) {
      this.pageChange.emit(page);
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newSize = parseInt(target.value, 10);
    this.pageSizeChange.emit(newSize);
  }
}