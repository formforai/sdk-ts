/**
 * Parse a human-readable duration string into milliseconds.
 * Supports: "30s", "5m", "2h", "1d"
 * Falls back to treating the value as raw milliseconds.
 */
export function parseMs(duration: string): number {
  const match = duration.match(/^(\d+)\s*(s|m|h|d)$/i)
  if (!match) {
    const raw = Number(duration)
    if (isNaN(raw)) {
      throw new Error(`Invalid duration: "${duration}"`)
    }
    return raw
  }

  const value = parseInt(match[1], 10)
  const unit = match[2].toLowerCase()

  switch (unit) {
    case 's':
      return value * 1_000
    case 'm':
      return value * 60_000
    case 'h':
      return value * 3_600_000
    case 'd':
      return value * 86_400_000
    default:
      return value
  }
}

/**
 * Sleep for the given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
