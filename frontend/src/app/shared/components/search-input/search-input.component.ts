import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchInputComponent),
      multi: true
    }
  ],
  template: `
    <div class="search-input" [class.loading]="loading">
      <i class="fas fa-search search-icon"></i>
      <input 
        type="text" 
        [placeholder]="placeholder"
        [(ngModel)]="value"
        (input)="onInput($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
        [disabled]="disabled"
        class="search-field"
      >
      <i *ngIf="loading" class="fas fa-spinner fa-spin loading-icon"></i>
      <button *ngIf="clearable && value" 
              class="clear-btn" 
              (click)="onClear()"
              type="button">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `,
  styles: [`
    .search-input {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      color: #8696a8;
      font-size: 14px;
      z-index: 1;
    }

    .loading-icon {
      position: absolute;
      right: 12px;
      color: #8696a8;
      font-size: 14px;
      z-index: 1;
    }

    .clear-btn {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: #8696a8;
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      z-index: 1;
    }

    .clear-btn:hover {
      background: #2b374a;
      color: #ffffff;
    }

    .search-field {
      width: 100%;
      background: #232e3c;
      border: none;
      padding: 12px 16px 12px 36px;
      border-radius: 24px;
      color: #ffffff;
      font-size: 14px;
      transition: background-color 0.2s;
    }

    .search-field::placeholder {
      color: #8696a8;
    }

    .search-field:focus {
      outline: none;
      background: #2b374a;
    }

    .search-field:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .search-input.loading .search-field {
      padding-right: 40px;
    }

    .search-input:has(.clear-btn) .search-field {
      padding-right: 40px;
    }
  `]
})
export class SearchInputComponent implements ControlValueAccessor {
  @Input() placeholder = 'Search...';
  @Input() loading = false;
  @Input() disabled = false;
  @Input() clearable = true;

  @Output() search = new EventEmitter<string>();
  @Output() focus = new EventEmitter<void>();
  @Output() blur = new EventEmitter<void>();
  @Output() clearClick = new EventEmitter<void>();

  value = '';
  
  private onChange = (value: string) => {};
  private onTouched = () => {};

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.search.emit(this.value);
  }

  onFocus(): void {
    this.onTouched();
    this.focus.emit();
  }

  onBlur(): void {
    this.blur.emit();
  }

  onClear(): void {
    this.value = '';
    this.onChange(this.value);
    this.search.emit(this.value);
    this.clearClick.emit();
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}