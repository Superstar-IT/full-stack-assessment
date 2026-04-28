import { tripStartToIso } from './datetime'

/** Build POST /api/plan body from react-hook-form values. */
export function buildTripPayload(values) {
  const payload = {
    current_location: values.current_location.trim(),
    pickup_location: values.pickup_location.trim(),
    dropoff_location: values.dropoff_location.trim(),
    current_cycle_used_hrs: Number(values.current_cycle_used_hrs),
    time_zone: (values.time_zone || '').trim() || 'America/Chicago',
  }
  const iso = tripStartToIso(values.trip_start)
  if (iso) payload.trip_start = iso
  return payload
}
