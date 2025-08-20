// Export all shared components
export * from './sidebar-navigation/sidebar-navigation.component';
export * from './search-input/search-input.component';
export * from './avatar-circle/avatar-circle.component';
export * from './status-badge/status-badge.component';
export * from './loading-spinner/loading-spinner.component';
export * from './pagination/pagination.component';
export * from './toast/toast.component';
export * from './dropdown/dropdown.component';
export * from './date-range-filter/date-range-filter.component';
export * from './sidebar-container/sidebar-container.component';
export * from './list-panel/list-panel.component';
export * from './list-item/list-item.component';

// Create a convenient array for importing all components
import { SidebarNavigationComponent } from './sidebar-navigation/sidebar-navigation.component';
import { SearchInputComponent } from './search-input/search-input.component';
import { AvatarCircleComponent } from './avatar-circle/avatar-circle.component';
import { StatusBadgeComponent } from './status-badge/status-badge.component';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';
import { PaginationComponent } from './pagination/pagination.component';
import { ToastComponent } from './toast/toast.component';
import { DropdownComponent } from './dropdown/dropdown.component';
import { DateRangeFilterComponent } from './date-range-filter/date-range-filter.component';
import { SidebarContainerComponent } from './sidebar-container/sidebar-container.component';
import { ListPanelComponent } from './list-panel/list-panel.component';
import { ListItemComponent } from './list-item/list-item.component';

export const SHARED_COMPONENTS = [
  SidebarNavigationComponent,
  SearchInputComponent,
  AvatarCircleComponent,
  StatusBadgeComponent,
  LoadingSpinnerComponent,
  PaginationComponent,
  ToastComponent,
  DropdownComponent,
  DateRangeFilterComponent,
  SidebarContainerComponent,
  ListPanelComponent,
  ListItemComponent
] as const;