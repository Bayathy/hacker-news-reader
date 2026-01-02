export function formatRelativeTimeFromUnixSeconds(unixSeconds: number, now = Date.now()): string {
  const ms = unixSeconds * 1000
  if (!Number.isFinite(ms) || ms <= 0) return ''

  const diffSeconds = Math.round((ms - now) / 1000)
  const abs = Math.abs(diffSeconds)

  const rtf = new Intl.RelativeTimeFormat('ja', { numeric: 'auto' })

  if (abs < 60) return rtf.format(diffSeconds, 'second')
  const diffMinutes = Math.round(diffSeconds / 60)
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute')
  const diffHours = Math.round(diffSeconds / 3600)
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour')
  const diffDays = Math.round(diffSeconds / 86400)
  return rtf.format(diffDays, 'day')
}
