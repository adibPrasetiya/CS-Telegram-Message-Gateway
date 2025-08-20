import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DropdownOption {
  value: any;
  label: string;
  icon?: string;
  disabled?: boolean;
  divider?: boolean;
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dropdown" #dropdownRef>
      <button
        class="dropdown-trigger"
        [class.active]="isOpen"
        (click)="toggle()"
        type="button"
        [disabled]="disabled">
        <i *ngIf="triggerIcon" [class]="'fas ' + triggerIcon"></i>
        <span *ngIf="triggerText" class="trigger-text">{{ triggerText }}</span>
        <i class="fas fa-chevron-down dropdown-arrow" [class.rotated]="isOpen"></i>
      </button>

      <div class="dropdown-menu" 
           [class.show]="isOpen"
           [class.align-right]="alignRight"
           [class.align-left]="!alignRight">
        <div *ngFor="let option of options" 
             class="dropdown-item"
             [class.disabled]="option.disabled"
             [class.divider]="option.divider"
             (click)="selectOption(option)">
          <i *ngIf="option.icon" [class]="'fas ' + option.icon + ' dropdown-item-icon'"></i>
          <span class="dropdown-item-label">{{ option.label }}</span>
          <i *ngIf="isSelected(option)" class="fas fa-check dropdown-item-check"></i>
        </div>

        <div *ngIf="options.length === 0" class="dropdown-empty">
          No options available
        </div>
      </div>
    </div>

    <!-- Backdrop -->
    <div *ngIf="isOpen" class="dropdown-backdrop" (click)="close()"></div>
  `,
  styles: [`
    .dropdown {
      position: relative;
      display: inline-block;
    }

    .dropdown-trigger {
      background: #232e3c;
      border: none;
      color: #ffffff;
      padding: 12px 16px;
      border-radius: 24px;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 140px;
      justify-content: space-between;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .dropdown-trigger:hover:not(:disabled) {
      background: #2b374a;
    }

    .dropdown-trigger:focus {
      outline: none;
      background: #2b374a;
    }

    .dropdown-trigger.active {
      background: #2b374a;
    }

    .dropdown-trigger:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .trigger-text {
      flex: 1;
      text-align: left;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dropdown-arrow {
      font-size: 10px;
      transition: transform 0.2s ease;
      flex-shrink: 0;
    }

    .dropdown-arrow.rotated {
      transform: rotate(180deg);
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      margin-top: 4px;
      background: #232e3c;
      border: 1px solid #2b374a;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      min-width: 180px;
      max-height: 300px;
      overflow-y: auto;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-8px);
      transition: all 0.2s ease;
    }

    .dropdown-menu.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .dropdown-menu.align-right {
      right: 0;
    }

    .dropdown-menu.align-left {
      left: 0;
    }

    .dropdown-menu::-webkit-scrollbar {
      width: 6px;
    }

    .dropdown-menu::-webkit-scrollbar-track {
      background: transparent;
    }

    .dropdown-menu::-webkit-scrollbar-thumb {
      background: #2b374a;
      border-radius: 3px;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      padding: 10px 14px;
      gap: 10px;
      cursor: pointer;
      transition: background-color 0.15s ease;
      font-size: 13px;
      color: #ffffff;
      border-bottom: 1px solid transparent;
    }

    .dropdown-item:hover:not(.disabled) {
      background: #2b374a;
    }

    .dropdown-item.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      color: #8696a8;
    }

    .dropdown-item.divider {
      border-bottom-color: #2b374a;
      margin-bottom: 4px;
      padding-bottom: 14px;
    }

    .dropdown-item-icon {
      font-size: 12px;
      color: #8696a8;
      flex-shrink: 0;
      width: 16px;
      text-align: center;
    }

    .dropdown-item-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .dropdown-item-check {
      font-size: 10px;
      color: #5288c1;
      flex-shrink: 0;
    }

    .dropdown-empty {
      padding: 20px 14px;
      text-align: center;
      color: #8696a8;
      font-size: 13px;
      font-style: italic;
    }

    .dropdown-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
      background: transparent;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .dropdown-menu {
        min-width: 200px;
        max-width: calc(100vw - 32px);
      }
    }
  `]
})
export class DropdownComponent implements OnInit, OnDestroy {
  @ViewChild('dropdownRef') dropdownRef!: ElementRef;

  @Input() options: DropdownOption[] = [];
  @Input() selectedValue: any = null;
  @Input() placeholder = 'Select option';
  @Input() triggerIcon?: string;
  @Input() disabled = false;
  @Input() alignRight = false;
  @Input() multiple = false;

  @Output() selectionChange = new EventEmitter<any>();
  @Output() opened = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  isOpen = false;
  selectedValues: any[] = [];

  private documentClickListener?: (event: Event) => void;

  ngOnInit(): void {
    if (this.multiple && this.selectedValue) {
      this.selectedValues = Array.isArray(this.selectedValue) ? this.selectedValue : [this.selectedValue];
    }
  }

  ngOnDestroy(): void {
    this.removeDocumentClickListener();
  }

  get triggerText(): string {
    if (this.multiple) {
      if (this.selectedValues.length === 0) {
        return this.placeholder;
      }
      if (this.selectedValues.length === 1) {
        const option = this.options.find(opt => opt.value === this.selectedValues[0]);
        return option?.label || this.placeholder;
      }
      return `${this.selectedValues.length} selected`;
    } else {
      const option = this.options.find(opt => opt.value === this.selectedValue);
      return option?.label || this.placeholder;
    }
  }

  toggle(): void {
    if (this.disabled) return;
    
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    if (this.disabled) return;
    
    this.isOpen = true;
    this.addDocumentClickListener();
    this.opened.emit();
  }

  close(): void {
    this.isOpen = false;
    this.removeDocumentClickListener();
    this.closed.emit();
  }

  selectOption(option: DropdownOption): void {
    if (option.disabled || option.divider) return;

    if (this.multiple) {
      const index = this.selectedValues.indexOf(option.value);
      if (index > -1) {
        this.selectedValues.splice(index, 1);
      } else {
        this.selectedValues.push(option.value);
      }
      this.selectionChange.emit([...this.selectedValues]);
    } else {
      this.selectedValue = option.value;
      this.selectionChange.emit(option.value);
      this.close();
    }
  }

  isSelected(option: DropdownOption): boolean {
    if (this.multiple) {
      return this.selectedValues.includes(option.value);
    }
    return this.selectedValue === option.value;
  }

  private addDocumentClickListener(): void {
    this.removeDocumentClickListener();
    
    this.documentClickListener = (event: Event) => {
      if (this.dropdownRef && !this.dropdownRef.nativeElement.contains(event.target)) {
        this.close();
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', this.documentClickListener!);
    }, 0);
  }

  private removeDocumentClickListener(): void {
    if (this.documentClickListener) {
      document.removeEventListener('click', this.documentClickListener);
      this.documentClickListener = undefined;
    }
  }
}