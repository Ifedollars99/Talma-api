/** Compact social counters — 1,250 becomes 1.3K. */
export function formatCount(value: number): string {
  if (!Number.isFinite(value) || value < 1000) return String(Math.max(0, value))
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}
