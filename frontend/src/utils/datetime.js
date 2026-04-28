export function tripStartToIso(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return ''
  const d = new Date(s)
  return Number.isFinite(d.getTime()) ? d.toISOString() : ''
}
