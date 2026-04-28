import { API_BASE } from '../config/env'
import { parseApiErrorBody } from './errors'

export async function postTripPlan(data) {
  const r = await fetch(`${API_BASE}/api/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const text = await r.text()
  if (!r.ok) {
    const { fieldErrors, general } = parseApiErrorBody(text, r.statusText)
    const err = new Error(general || 'Validation failed')
    err.fieldErrors = fieldErrors
    err.status = r.status
    throw err
  }
  return text ? JSON.parse(text) : {}
}
