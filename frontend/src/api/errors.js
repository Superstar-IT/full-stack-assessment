export function parseApiErrorBody(text, statusText) {
  const raw = text?.trim() || ''
  try {
    const j = JSON.parse(raw)
    if (j && typeof j === 'object' && !Array.isArray(j)) {
      const fieldErrors = {}
      const generalParts = []
      for (const [key, val] of Object.entries(j)) {
        if (Array.isArray(val)) {
          fieldErrors[key] = val.map(String).join(' ')
        } else if (typeof val === 'string') {
          if (key === 'geocode' || key === 'routing' || key === 'detail') {
            generalParts.push(val)
          } else {
            fieldErrors[key] = val
          }
        }
      }
      const hasFields = Object.keys(fieldErrors).length > 0
      const general =
        generalParts.length > 0
          ? generalParts.join(' ')
          : hasFields
            ? ''
            : raw || statusText || 'Request failed'
      return { fieldErrors, general }
    }
  } catch {}
  return { fieldErrors: {}, general: raw || statusText || 'Request failed' }
}
