/** Shared react-hook-form validation rules for trip fields. */

export const locationRules = {
  current_location: {
    required: 'Enter your current location',
    validate: (v) => String(v || '').trim().length > 0 || 'This field may not be blank.',
  },
  pickup_location: {
    required: 'Enter pickup location',
    validate: (v) => String(v || '').trim().length > 0 || 'This field may not be blank.',
  },
  dropoff_location: {
    required: 'Enter dropoff location',
    validate: (v) => String(v || '').trim().length > 0 || 'This field may not be blank.',
  },
}

export const cycleRules = {
  required: 'Enter cycle hours used (0–70)',
  valueAsNumber: true,
  validate: {
    finite: (v) => Number.isFinite(v) || 'Enter a valid number',
    range: (v) => (v >= 0 && v <= 70) || 'Hours must be between 0 and 70',
  },
}

export const timeZoneRules = {
  required: 'Enter a time zone',
  validate: (v) => {
    const s = String(v || '').trim()
    if (s.length < 3) return 'Enter a time zone'
    if (!s.includes('/')) return 'Use an IANA zone (e.g. America/Chicago)'
    return true
  },
}

export const tripStartRules = {
  validate: (v) => {
    const s = String(v ?? '').trim()
    if (!s) return true
    const d = new Date(s)
    return Number.isFinite(d.getTime()) || 'Choose a valid date and time'
  },
}
