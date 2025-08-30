/**
 * Utility functions for safe array operations
 */

/**
 * Safely converts a value to an array
 * @param value - The value to convert to an array
 * @returns An array, empty if the input is undefined/null
 */
export function toArray<T>(value: T[] | undefined | null): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return [];
}

/**
 * Safely maps over an array-like value
 * @param value - The array or undefined/null value
 * @param mapper - Function to map each item
 * @returns Mapped array or empty array if input is invalid
 */
export function safeMap<T, U>(
  value: T[] | undefined | null,
  mapper: (item: T, index: number, array: T[]) => U
): U[] {
  return toArray(value).map(mapper);
}

/**
 * Safely filters an array-like value
 * @param value - The array or undefined/null value
 * @param predicate - Function to filter items
 * @returns Filtered array or empty array if input is invalid
 */
export function safeFilter<T>(
  value: T[] | undefined | null,
  predicate: (item: T, index: number, array: T[]) => boolean
): T[] {
  return toArray(value).filter(predicate);
}