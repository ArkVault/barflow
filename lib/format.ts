/**
 * Formatting utilities — single source of truth for display formatting.
 */

/**
 * Format a number as currency (USD).
 * Returns a string like "$12.50".
 */
export function formatCurrency(amount: number | undefined | null): string {
     return `$${(amount ?? 0).toFixed(2)}`;
}

/**
 * Format a number as a percentage string.
 * Returns a string like "42%".
 */
export function formatPercent(value: number, decimals: number = 0): string {
     return `${value.toFixed(decimals)}%`;
}
