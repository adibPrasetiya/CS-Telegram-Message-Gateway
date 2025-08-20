import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface DateRange {
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-date-range-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="date-range-filter" [class.expanded]="isExpanded">
      <div class="date-range-header">
        <div class="date-range-title">
          <i class="fas fa-calendar-alt"></i>
          <span>Date Range</span>
        </div>
        <div class="date-range-actions">
          <button 
            *ngIf="hasActiveFilter"
            class="clear-btn"
            (click)="clearFilter()"
            title="Clear date filter">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div class="date-range-content">
        <div class="date-input-group">
          <div class="date-input-wrapper">
            <label class="date-label">From</label>
            <div class="date-input">
              <i class="fas fa-calendar date-icon"></i>
              <input 
                type="date"
                [(ngModel)]="startDate"
                (change)="onDateChange()"
                [max]="endDate || maxDate"
                class="date-field">
            </div>
          </div>

          <div class="date-separator">
            <i class="fas fa-arrow-right"></i>
          </div>

          <div class="date-input-wrapper">
            <label class="date-label">To</label>
            <div class="date-input">
              <i class="fas fa-calendar date-icon"></i>
              <input 
                type="date"
                [(ngModel)]="endDate"
                (change)="onDateChange()"
                [min]="startDate"
                [max]="maxDate"
                class="date-field">
            </div>
          </div>
        </div>

        <div class="quick-filters">
          <button 
            *ngFor="let filter of quickFilters"
            class="quick-filter-btn"
            [class.active]="isQuickFilterActive(filter)"
            (click)="applyQuickFilter(filter)">
            {{ filter.label }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .date-range-filter {
      background: #232e3c;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #2b374a;
      transition: all 0.3s ease;
    }

    .date-range-header {
      padding: 14px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #2b374a;
    }

    .date-range-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #ffffff;
      font-size: 14px;
      font-weight: 500;
    }

    .date-range-title i {
      color: #5288c1;
      font-size: 16px;
    }

    .date-range-actions {
      display: flex;
      gap: 8px;
    }

    .clear-btn {
      background: none;
      border: none;
      color: #8696a8;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s;
      font-size: 12px;
    }

    .clear-btn:hover {
      background: #2b374a;
      color: #ffffff;
    }

    .date-range-content {
      padding: 16px;
    }

    .date-input-group {
      display: flex;
      align-items: flex-end;
      gap: 12px;
      margin-bottom: 16px;
    }

    .date-input-wrapper {
      flex: 1;
    }

    .date-label {
      display: block;
      color: #8696a8;
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .date-input {
      position: relative;
      display: flex;
      align-items: center;
    }

    .date-icon {
      position: absolute;
      left: 12px;
      color: #8696a8;
      font-size: 14px;
      pointer-events: none;
      z-index: 1;
    }

    .date-field {
      width: 100%;
      background: #17212b;
      border: 1px solid #2b374a;
      border-radius: 8px;
      padding: 10px 12px 10px 36px;
      color: #ffffff;
      font-size: 13px;
      transition: all 0.2s ease;
    }

    .date-field:focus {
      outline: none;
      border-color: #5288c1;
      background: #1a252f;
    }

    .date-field::-webkit-calendar-picker-indicator {
      opacity: 0;
      position: absolute;
      right: 8px;
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    .date-separator {
      color: #8696a8;
      font-size: 12px;
      margin-bottom: 2px;
      flex-shrink: 0;
    }

    .quick-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .quick-filter-btn {
      background: #17212b;
      border: 1px solid #2b374a;
      color: #8696a8;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .quick-filter-btn:hover {
      background: #2b374a;
      color: #ffffff;
      border-color: #5288c1;
    }

    .quick-filter-btn.active {
      background: #5288c1;
      color: white;
      border-color: #5288c1;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .date-input-group {
        flex-direction: column;
        gap: 16px;
      }

      .date-separator {
        transform: rotate(90deg);
        margin: 0;
      }

      .quick-filters {
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .date-range-content {
        padding: 12px;
      }

      .quick-filters {
        flex-direction: column;
      }

      .quick-filter-btn {
        text-align: center;
      }
    }
  `]
})
export class DateRangeFilterComponent implements OnInit {
  @Input() startDate = '';
  @Input() endDate = '';
  @Input() maxDate?: string;
  @Input() isExpanded = true;

  @Output() dateRangeChange = new EventEmitter<DateRange>();
  @Output() clear = new EventEmitter<void>();

  quickFilters = [
    { label: 'Today', days: 0 },
    { label: 'Yesterday', days: 1, single: true },
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'This Month', type: 'month' },
    { label: 'Last Month', type: 'lastMonth' }
  ];

  ngOnInit(): void {
    if (!this.maxDate) {
      this.maxDate = new Date().toISOString().split('T')[0];
    }
  }

  get hasActiveFilter(): boolean {
    return !!(this.startDate || this.endDate);
  }

  onDateChange(): void {
    this.dateRangeChange.emit({
      startDate: this.startDate,
      endDate: this.endDate
    });
  }

  clearFilter(): void {
    this.startDate = '';
    this.endDate = '';
    this.clear.emit();
    this.onDateChange();
  }

  applyQuickFilter(filter: any): void {
    const today = new Date();
    let start: Date;
    let end: Date;

    switch (filter.type) {
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        if (filter.single) {
          start = new Date(today);
          start.setDate(today.getDate() - filter.days);
          end = new Date(start);
        } else if (filter.days === 0) {
          start = new Date(today);
          end = new Date(today);
        } else {
          start = new Date(today);
          start.setDate(today.getDate() - filter.days);
          end = today;
        }
    }

    this.startDate = start.toISOString().split('T')[0];
    this.endDate = end.toISOString().split('T')[0];
    this.onDateChange();
  }

  isQuickFilterActive(filter: any): boolean {
    if (!this.startDate || !this.endDate) return false;

    const today = new Date();
    let expectedStart: Date;
    let expectedEnd: Date;

    switch (filter.type) {
      case 'month':
        expectedStart = new Date(today.getFullYear(), today.getMonth(), 1);
        expectedEnd = today;
        break;
      case 'lastMonth':
        expectedStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        expectedEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        if (filter.single) {
          expectedStart = new Date(today);
          expectedStart.setDate(today.getDate() - filter.days);
          expectedEnd = new Date(expectedStart);
        } else if (filter.days === 0) {
          expectedStart = new Date(today);
          expectedEnd = new Date(today);
        } else {
          expectedStart = new Date(today);
          expectedStart.setDate(today.getDate() - filter.days);
          expectedEnd = today;
        }
    }

    const startMatch = this.startDate === expectedStart.toISOString().split('T')[0];
    const endMatch = this.endDate === expectedEnd.toISOString().split('T')[0];

    return startMatch && endMatch;
  }
}