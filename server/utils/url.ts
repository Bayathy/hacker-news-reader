export function extractDomain(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null
  try {
    const url = new URL(rawUrl)
    return url.hostname || null
  } catch {
    return null
  }
}
