/**
 * Date Utility Functions
 * Handles date normalization for database operations
 * MySQL expects DATE format: YYYY-MM-DD
 * Frontend sends ISO format: 2025-09-27T17:00:00.000Z
 */

/**
 * Normalize date value for MySQL DATE column
 * - null/undefined/empty string -> null
 * - ISO string (2025-09-27T17:00:00.000Z) -> extract YYYY-MM-DD
 * - Already YYYY-MM-DD -> return as-is
 * @param {string|Date|null|undefined} value
 * @returns {string|null}
 */
export function normalizeDate(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  // Already in correct format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  // ISO format: 2025-09-27T17:00:00.000Z or 2025-09-27T17:00:00Z
  const isoMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) {
    return isoMatch[1];
  }

  // Try parsing as Date object
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  return null;
}

/**
 * Normalize datetime value for MySQL DATETIME column
 * - null/undefined/empty string -> null
 * - ISO string -> convert to YYYY-MM-DD HH:MM:SS
 * - Already in correct format -> return as-is
 * @param {string|Date|null|undefined} value
 * @returns {string|null}
 */
export function normalizeDateTime(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  // Already in correct format YYYY-MM-DD HH:MM:SS
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  // ISO format: 2025-09-27T17:00:00.000Z
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

  return null;
}

/**
 * Format date for frontend display
 * @param {string|Date|null|undefined} value
 * @param {string} locale - default 'vi-VN'
 * @returns {string}
 */
export function formatDateForDisplay(value, locale = 'vi-VN') {
  if (!value) return '—';

  const date = new Date(value);
  if (isNaN(date.getTime())) return '—';

  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}
