/** `datetime-local` value → ISO string for the API (browser interprets as local wall time). */
export function tripStartToIso(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return ''
  const d = new Date(s)
  return Number.isFinite(d.getTime()) ? d.toISOString() : ''
}
