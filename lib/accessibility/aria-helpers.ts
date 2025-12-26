/**
 * ARIA Helpers - Utility functions for WCAG 2.1 AA compliance
 */

/**
 * Generates a unique ID for ARIA relationships
 */
export function generateAriaId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates proper ARIA attributes for form fields
 */
export function getFieldAriaProps({
  id,
  label,
  error,
  description,
  required = false,
}: {
  id: string;
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
}) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return {
    id,
    'aria-label': label,
    'aria-required': required,
    'aria-invalid': !!error,
    'aria-describedby': [descriptionId, errorId].filter(Boolean).join(' ') || undefined,
    'aria-errormessage': errorId,
  };
}

/**
 * Creates ARIA attributes for expandable sections
 */
export function getExpandableAriaProps({
  id,
  expanded,
  controlsId,
}: {
  id: string;
  expanded: boolean;
  controlsId: string;
}) {
  return {
    id,
    'aria-expanded': expanded,
    'aria-controls': controlsId,
    role: 'button',
    tabIndex: 0,
  };
}

/**
 * Creates ARIA attributes for modal dialogs
 */
export function getModalAriaProps({
  titleId,
  descriptionId,
  open,
}: {
  titleId: string;
  descriptionId?: string;
  open: boolean;
}) {
  return {
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': titleId,
    'aria-describedby': descriptionId,
    'aria-hidden': !open,
  };
}

/**
 * Creates ARIA attributes for sortable table headers
 */
export function getSortableHeaderAriaProps({
  columnName,
  sortDirection,
}: {
  columnName: string;
  sortDirection?: 'asc' | 'desc' | 'none';
}) {
  return {
    role: 'columnheader',
    'aria-sort': sortDirection || 'none',
    'aria-label': `${columnName}, ${sortDirection === 'asc' ? 'ordenado ascendente' : sortDirection === 'desc' ? 'ordenado descendente' : 'sin ordenar'}`,
    tabIndex: 0,
  };
}

/**
 * Creates ARIA attributes for progress indicators
 */
export function getProgressAriaProps({
  value,
  max = 100,
  label,
}: {
  value: number;
  max?: number;
  label: string;
}) {
  const percentage = Math.round((value / max) * 100);
  return {
    role: 'progressbar',
    'aria-valuenow': value,
    'aria-valuemin': 0,
    'aria-valuemax': max,
    'aria-valuetext': `${percentage}%`,
    'aria-label': label,
  };
}

/**
 * Creates ARIA attributes for tabs
 */
export function getTabAriaProps({
  id,
  panelId,
  selected,
}: {
  id: string;
  panelId: string;
  selected: boolean;
}) {
  return {
    id,
    role: 'tab',
    'aria-selected': selected,
    'aria-controls': panelId,
    tabIndex: selected ? 0 : -1,
  };
}

export function getTabPanelAriaProps({
  id,
  tabId,
  hidden,
}: {
  id: string;
  tabId: string;
  hidden: boolean;
}) {
  return {
    id,
    role: 'tabpanel',
    'aria-labelledby': tabId,
    hidden,
    tabIndex: 0,
  };
}
