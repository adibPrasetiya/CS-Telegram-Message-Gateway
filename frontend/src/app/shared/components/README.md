# Reusable UI Components

This directory contains reusable Angular components that provide consistent UI elements across the application.

## Components

### 1. SidebarNavigationComponent (`<app-sidebar-navigation>`)

Provides a navigation sidebar with user information and menu items.

**Usage:**
```html
<app-sidebar-navigation
  [currentUser]="currentUser"
  [navigationItems]="navItems"
  [collapsed]="sidebarCollapsed"
  [isMobile]="isMobile"
  [showMobileMenu]="showMobileMenu"
  (itemClick)="onNavItemClick($event)"
  (logout)="onLogout()">
</app-sidebar-navigation>
```

**Navigation Items Example:**
```typescript
navItems: NavigationItem[] = [
  { id: 'chats', icon: 'fa-comments', label: 'Chats', isActive: true },
  { id: 'history', icon: 'fa-history', label: 'History' },
  { id: 'clients', icon: 'fa-users', label: 'Clients' },
  { id: 'broadcast', icon: 'fa-bullhorn', label: 'Broadcast', isVisible: isAdmin }
];
```

### 2. SearchInputComponent (`<app-search-input>`)

A reusable search input with loading states and clear functionality.

**Usage:**
```html
<app-search-input
  [(ngModel)]="searchQuery"
  (search)="onSearch($event)"
  placeholder="Search..."
  [loading]="isSearching"
  [clearable]="true">
</app-search-input>
```

### 3. AvatarCircleComponent (`<app-avatar-circle>`)

Displays user avatars with online status indicators.

**Usage:**
```html
<app-avatar-circle
  [name]="user.name"
  [isOnline]="user.isOnline"
  size="large"
  [backgroundColor]="#custom-color">
</app-avatar-circle>
```

**Sizes:** `'small'` | `'medium'` | `'large'`

### 4. StatusBadgeComponent (`<app-status-badge>`)

Shows status badges with different styles and colors.

**Usage:**
```html
<app-status-badge
  [status]="'active'"
  size="medium"
  [showIcon]="true">
</app-status-badge>
```

**Status Types:** `'active'` | `'inactive'` | `'ended'` | `'pending'` | `'online'` | `'offline'`

### 5. LoadingSpinnerComponent (`<app-loading-spinner>`)

Displays loading spinners with customizable sizes and messages.

**Usage:**
```html
<app-loading-spinner
  size="medium"
  message="Loading data..."
  [overlay]="true">
</app-loading-spinner>
```

**Inline Usage:**
```html
<app-loading-spinner
  size="small"
  [inline]="true">
</app-loading-spinner>
```

### 6. PaginationComponent (`<app-pagination>`)

Provides pagination controls with page numbers and navigation.

**Usage:**
```html
<app-pagination
  [pagination]="paginationInfo"
  (pageChange)="onPageChange($event)"
  [showPageNumbers]="true"
  [showTotalCount]="true"
  [showFirstLast]="true">
</app-pagination>
```

**Pagination Info Interface:**
```typescript
interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
```

### 7. ToastComponent (`<app-toast>`)

Shows toast notifications for success, error, warning, and info messages.

**Usage:**
```html
<app-toast
  [visible]="showToast"
  [type]="'success'"
  [message]="toastMessage"
  [title]="toastTitle"
  (close)="onToastClose()"
  [duration]="5000">
</app-toast>
```

**Toast Types:** `'success'` | `'error'` | `'warning'` | `'info'`

### 8. DropdownComponent (`<app-dropdown>`)

Provides a styled dropdown menu with single or multiple selection support.

**Usage:**
```html
<app-dropdown
  [options]="dropdownOptions"
  [selectedValue]="selectedValue"
  placeholder="Select option"
  triggerIcon="fa-filter"
  [alignRight]="false"
  (selectionChange)="onSelectionChange($event)">
</app-dropdown>
```

**Multiple Selection:**
```html
<app-dropdown
  [options]="dropdownOptions"
  [selectedValue]="selectedValues"
  [multiple]="true"
  placeholder="Select options"
  (selectionChange)="onMultipleSelectionChange($event)">
</app-dropdown>
```

**Dropdown Options Interface:**
```typescript
interface DropdownOption {
  value: any;
  label: string;
  icon?: string;
  disabled?: boolean;
  divider?: boolean;
}
```

**Example Options:**
```typescript
dropdownOptions: DropdownOption[] = [
  { value: '', label: 'All Status', icon: 'fa-list' },
  { value: 'active', label: 'Active', icon: 'fa-play-circle' },
  { value: 'inactive', label: 'Inactive', icon: 'fa-stop-circle', divider: true },
  { value: 'disabled', label: 'Disabled Option', disabled: true }
];
```

### 9. DateRangeFilterComponent (`<app-date-range-filter>`)

Provides a comprehensive date range filter with quick filter buttons and custom date selection.

**Usage:**
```html
<app-date-range-filter
  [startDate]="filters.dateFrom"
  [endDate]="filters.dateTo"
  [maxDate]="maxDate"
  [isExpanded]="true"
  (dateRangeChange)="onDateRangeChange($event)"
  (clear)="clearDateFilter()">
</app-date-range-filter>
```

**Date Range Interface:**
```typescript
interface DateRange {
  startDate: string;
  endDate: string;
}
```

**Features:**
- Quick filter buttons (Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Last Month)
- Custom date picker inputs with calendar icons
- Clear filter functionality
- Responsive design for mobile devices
- Visual feedback for active filters
- Proper date validation (end date >= start date)

## How to Import

Import the components in your module or standalone component:

```typescript
import { 
  SearchInputComponent,
  AvatarCircleComponent,
  StatusBadgeComponent,
  LoadingSpinnerComponent,
  PaginationComponent,
  ToastComponent,
  SidebarNavigationComponent,
  DropdownComponent,
  DateRangeFilterComponent
} from '../shared/components';

@Component({
  // ...
  imports: [
    CommonModule,
    FormsModule,
    SearchInputComponent,
    AvatarCircleComponent,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    PaginationComponent,
    ToastComponent,
    SidebarNavigationComponent,
    DropdownComponent,
    DateRangeFilterComponent
  ]
})
```

Or import all at once:
```typescript
import { SHARED_COMPONENTS } from '../shared/components';

@Component({
  // ...
  imports: [
    CommonModule,
    FormsModule,
    ...SHARED_COMPONENTS
  ]
})
```

## Styling

All components use the existing design system with CSS custom properties for theming. The components are styled to match the current Telegram-inspired design with dark theme colors.

## TypeScript Support

All components are fully typed with TypeScript interfaces for inputs and outputs, providing excellent IDE support and type safety.